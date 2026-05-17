/**
 * App-only settings — persisted to AsyncStorage.
 * These don't affect the device; they only tune how the app interprets data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface AppSettings {
  offlineThresholdSeconds: number;   // how stale before status = Offline
  tdsCleanMax: number;               // ppm — below this is "Clean"
  tdsModerateMax: number;            // ppm — below this is "Moderate", above is "Poor"
  basinNormalMax: number;            // °C — below is "Normal"
  basinWarmMax: number;              // °C — below is "Warm", above is "Hot"
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  offlineThresholdSeconds: 30,
  tdsCleanMax: 300,
  tdsModerateMax: 500,
  basinNormalMax: 50,
  basinWarmMax: 55,
};

const STORAGE_KEY = 'walrus_app_settings_v1';

interface AppSettingsContextValue {
  settings: AppSettings;
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  reset: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue>({
  settings: DEFAULT_APP_SETTINGS,
  set: () => {},
  reset: () => {},
});

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  // Load persisted settings once
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings({ ...DEFAULT_APP_SETTINGS, ...parsed });
      } catch {
        // ignore corrupt storage
      }
    });
  }, []);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ settings, set, reset }), [settings]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextValue {
  return useContext(AppSettingsContext);
}
