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
  mist_active: boolean | null;
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
  mist_override: Override;
  peltier_override: Override;
  updated_at: string;
}

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

      console.log('[API] getLatest success:', data.id, data.created_at);
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
      const query = supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return { success: false, data: [], count: 0 };
      }

      return { success: true, data: data || [], count: data?.length || 0 };
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
    const channel = supabase
      .channel(`sensor_readings_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          callback(payload.new as SensorReading);
        }
      )
      .subscribe();

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
    patch: Partial<Pick<DeviceCommands, 'sleep' | 'intake_pump_override' | 'collect_pump_override' | 'mist_override' | 'peltier_override'>>,
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
    const channel = supabase
      .channel(`device_commands_${deviceId}`)
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
