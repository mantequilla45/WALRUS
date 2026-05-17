/**
 * WALRUS API Service
 * Queries Supabase directly for sensor data
 */

import { supabase } from './supabase';

// Types
export interface SensorReading {
  id: number;
  created_at: string;
  device_id: string;
  basin_temp: number | null;
  tds_ppm: number | null;
  clean_level_cm: number | null;
  intake_pump_active: boolean | null;
  collect_pump_active: boolean | null;
  peltier_active: boolean | null;
  float_water_detect: boolean | null;
  state: string | null;
}

export interface LatestDataResponse {
  success: boolean;
  data: SensorReading | null;
  message?: string;
}

export type Override = 'auto' | 'on' | 'off';

export interface DeviceCommands {
  device_id: string;
  sleep: boolean;
  intake_pump_override: Override;
  collect_pump_override: Override;
  peltier_override: Override;

  // Runtime config — applied live by the firmware on next sync
  wake_minute: number;              // 0-1439, PST minute-of-day
  sleep_minute: number;
  peltier_start_minute: number;
  peltier_stop_minute: number;
  peltier_on_minutes: number;
  peltier_cycle_minutes: number;
  collect_cycle_minutes: number;
  collect_duration_seconds: number;
  sync_interval_ms: number;

  updated_at: string;
}

export type DeviceConfigKey =
  | 'wake_minute'
  | 'sleep_minute'
  | 'peltier_start_minute'
  | 'peltier_stop_minute'
  | 'peltier_on_minutes'
  | 'peltier_cycle_minutes'
  | 'collect_cycle_minutes'
  | 'collect_duration_seconds'
  | 'sync_interval_ms';

const DEFAULT_DEVICE_ID = 'WALRUS_001';

/**
 * WALRUS API Client — Direct Supabase Queries
 */
export const walrusAPI = {
  /**
   * Get the latest sensor reading
   */
  getLatest: async (deviceId: string = DEFAULT_DEVICE_ID): Promise<LatestDataResponse> => {
    try {
      const query = supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('[API] getLatest: querying sensor_readings for', deviceId);
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[API] getLatest error:', error.message, error.code, error.details);
        return { success: false, data: null, message: error.message };
      }

      if (!data) {
        console.log('[API] getLatest: no readings yet');
        return { success: true, data: null, message: 'Waiting for first reading' };
      }

      console.log('[API] getLatest success: id', data.id, 'at', new Date(data.created_at).toLocaleString());
      return { success: true, data };
    } catch (e: any) {
      console.error('[API] getLatest exception:', e.message, e);
      return { success: false, data: null, message: e.message || 'Failed to fetch data' };
    }
  },

  /**
   * Get historical sensor data
   */
  getHistory: async (
    duration: '1h' | '24h' | '7d' | '30d' = '24h',
    deviceId: string = DEFAULT_DEVICE_ID
  ): Promise<{ success: boolean; data: SensorReading[]; count: number }> => {
    const durationMap: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(Date.now() - durationMap[duration]).toISOString();

    try {
      // Seek-based pagination: walk forward in `created_at` order. Each page is
      // its own self-contained SELECT, so Supabase's max_rows cap on offset
      // queries doesn't apply.
      const PAGE = 1000;
      const MAX_PAGES = 50; // safety ceiling = 50K rows
      const all: SensorReading[] = [];
      let cursor = since; // start at the "since" boundary, exclusive

      for (let p = 0; p < MAX_PAGES; p++) {
        const { data, error } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('device_id', deviceId)
          .gt('created_at', cursor)
          .order('created_at', { ascending: true })
          .limit(PAGE);

        if (error) {
          console.error('[API] getHistory page error:', error.message);
          return { success: false, data: [], count: 0 };
        }
        console.log(`[API] getHistory page ${p}: ${data?.length ?? 0} rows from cursor ${new Date(cursor).toLocaleString()}`);
        if (!data || data.length === 0) break;
        all.push(...(data as SensorReading[]));
        if (data.length < PAGE) break; // last page
        cursor = data[data.length - 1].created_at;
      }

      console.log(`[API] getHistory ${duration} for ${deviceId}: ${all.length} rows`);
      return { success: true, data: all, count: all.length };
    } catch {
      return { success: false, data: [], count: 0 };
    }
  },

  /**
   * Subscribe to real-time sensor updates
   */
  subscribeToReadings: (
    callback: (reading: SensorReading) => void,
    deviceId: string = DEFAULT_DEVICE_ID
  ) => {
    console.log('[Realtime] subscribing to sensor_readings for', deviceId);
    // Unique channel name per subscription instance — avoids stale-binding errors
    // when the same channel name has been used with different filters before.
    const channelName = `sensor_readings:${deviceId}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          console.log('[Realtime] INSERT event received: id', (payload.new as any)?.id, 'at', new Date((payload.new as any)?.created_at).toLocaleString());
          callback(payload.new as SensorReading);
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] sensor_readings subscription status:', status, err ?? '');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Read current command overrides for a device. Returns null if no row yet.
   */
  getDeviceCommands: async (
    deviceId: string = DEFAULT_DEVICE_ID
  ): Promise<DeviceCommands | null> => {
    const { data, error } = await supabase
      .from('device_commands')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('[API] getDeviceCommands error:', error.message);
      return null;
    }
    return (data as DeviceCommands) ?? null;
  },

  /**
   * Update (or create) command overrides for a device.
   */
  setDeviceCommands: async (
    patch: Partial<Pick<DeviceCommands,
      | 'sleep'
      | 'intake_pump_override'
      | 'collect_pump_override'
      | 'peltier_override'
      | DeviceConfigKey
    >>,
    deviceId: string = DEFAULT_DEVICE_ID
  ): Promise<DeviceCommands | null> => {
    const { data, error } = await supabase
      .from('device_commands')
      .upsert({ device_id: deviceId, ...patch }, { onConflict: 'device_id' })
      .select()
      .single();

    if (error) {
      console.error('[API] setDeviceCommands error:', error.message);
      return null;
    }
    return data as DeviceCommands;
  },

  /**
   * Subscribe to realtime changes on the device_commands row.
   */
  subscribeToDeviceCommands: (
    callback: (commands: DeviceCommands) => void,
    deviceId: string = DEFAULT_DEVICE_ID
  ) => {
    const channelName = `device_commands:${deviceId}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_commands',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          if (payload.new) callback(payload.new as DeviceCommands);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
