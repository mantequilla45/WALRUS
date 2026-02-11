/**
 * WALRUS API Service
 * Handles all API calls to the backend server
 */

import axios from 'axios';

// Get API URL from environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_URL}/api/mobile`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface SensorData {
  basin_temp: number | null;
  condenser_temp: number | null;
  tds_ppm: number | null;
  water_level_cm: number | null;
  battery_voltage: number | null;
  solar_current: number | null;
}

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

export interface HistoricalDataResponse {
  success: boolean;
  data: SensorReading[];
  count: number;
  duration: string;
}

export interface SystemStatus {
  status: 'online' | 'offline';
  last_seen: string | null;
  system_state: string | null;
  battery_voltage: number | null;
  warnings: string[];
  device_id: string;
}

export interface Statistics {
  count: number;
  duration: string;
  basin_temp: {
    avg: number | null;
    min: number | null;
    max: number | null;
  };
  condenser_temp: {
    avg: number | null;
    min: number | null;
    max: number | null;
  };
  tds_ppm: {
    avg: number | null;
    min: number | null;
    max: number | null;
  };
  battery_voltage: {
    avg: number | null;
    min: number | null;
    max: number | null;
  };
}

/**
 * WALRUS API Client
 */
export const walrusAPI = {
  /**
   * Get the latest sensor reading
   */
  getLatest: async (deviceId?: string): Promise<LatestDataResponse> => {
    const params = deviceId ? { device_id: deviceId } : {};
    const response = await apiClient.get<LatestDataResponse>('/latest', { params });
    return response.data;
  },

  /**
   * Get historical sensor data
   * @param duration - Time range: '1h', '24h', '7d', '30d'
   * @param deviceId - Optional device ID filter
   */
  getHistory: async (
    duration: '1h' | '24h' | '7d' | '30d' = '24h',
    deviceId?: string
  ): Promise<HistoricalDataResponse> => {
    const params: any = { duration };
    if (deviceId) params.device_id = deviceId;
    const response = await apiClient.get<HistoricalDataResponse>('/history', { params });
    return response.data;
  },

  /**
   * Get system status and health
   */
  getStatus: async (deviceId?: string): Promise<SystemStatus> => {
    const params = deviceId ? { device_id: deviceId } : {};
    const response = await apiClient.get<SystemStatus>('/status', { params });
    return response.data;
  },

  /**
   * Get statistical summary
   * @param duration - Time range: '1h', '24h', '7d', '30d'
   * @param deviceId - Optional device ID filter
   */
  getStats: async (
    duration: '1h' | '24h' | '7d' | '30d' = '24h',
    deviceId?: string
  ): Promise<Statistics> => {
    const params: any = { duration };
    if (deviceId) params.device_id = deviceId;
    const response = await apiClient.get<Statistics>('/stats', { params });
    return response.data;
  },

  /**
   * Check if backend is reachable
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.status === 200;
    } catch {
      return false;
    }
  },
};

// Export axios instance for custom requests
export { apiClient };
