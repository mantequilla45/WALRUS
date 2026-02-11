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
  condenser_temp: number | null;
  tds_ppm: number | null;
  water_level_cm: number | null;
  battery_voltage: number | null;
  solar_current: number | null;
  system_state: string | null;
  pump_active: boolean | null;
  fan_active: boolean | null;
}

export interface LatestDataResponse {
  success: boolean;
  data: SensorReading | null;
  message?: string;
}

/**
 * WALRUS API Client — Direct Supabase Queries
 */
export const walrusAPI = {
  /**
   * Get the latest sensor reading
   */
  getLatest: async (deviceId?: string): Promise<LatestDataResponse> => {
    try {
      let query = supabase
        .from('sensor_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query.single();

      if (error) {
        return { success: false, data: null, message: error.message };
      }

      return { success: true, data };
    } catch (e: any) {
      return { success: false, data: null, message: e.message || 'Failed to fetch data' };
    }
  },

  /**
   * Get historical sensor data
   */
  getHistory: async (
    duration: '1h' | '24h' | '7d' | '30d' = '24h',
    deviceId?: string
  ): Promise<{ success: boolean; data: SensorReading[]; count: number }> => {
    const durationMap: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(Date.now() - durationMap[duration]).toISOString();

    try {
      let query = supabase
        .from('sensor_readings')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

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
    deviceId?: string
  ) => {
    const channel = supabase
      .channel('sensor_readings_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          ...(deviceId ? { filter: `device_id=eq.${deviceId}` } : {}),
        },
        (payload) => {
          callback(payload.new as SensorReading);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
