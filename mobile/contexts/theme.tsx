/**
 * Theme system — semantic tokens + provider + hook.
 *
 * Usage:
 *   const t = useTheme();
 *   <View style={[styles.card, { backgroundColor: t.cardBg }]} />
 *
 * Layout / sizing stays in StyleSheet.create. Colors are pulled from `t` at render time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Theme {
  isDark: boolean;
  // Surfaces
  bg: string;             // page background
  cardBg: string;         // card background
  surfaceMuted: string;   // inactive pill / divider / disabled control track
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  // State / accents
  accent: string;         // primary blue
  success: string;        // green
  warning: string;        // orange
  danger: string;         // red
  purple: string;         // sleep
  cyan: string;           // info / clean water
  // Soft icon backgrounds (lighter tints behind icons)
  accentSoft: string;
  successSoft: string;
  warningSoft: string;
  dangerSoft: string;
  purpleSoft: string;
  cyanSoft: string;
  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  // Chevrons / off icons
  chevron: string;
  // Pill backgrounds
  pillTrack: string;      // unselected pill group background
  pillThumbActive: string; // selected pill background (in toggles)
}

const lightTheme: Theme = {
  isDark: false,
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  surfaceMuted: '#F2F2F7',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  accent: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  purple: '#5856D6',
  cyan: '#5AC8FA',
  accentSoft: '#EBF5FF',
  successSoft: '#E8F8ED',
  warningSoft: '#FFF3E0',
  dangerSoft: '#FFEBEB',
  purpleSoft: '#F0F4FF',
  cyanSoft: '#E8F4FD',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#D1D1D6',
  chevron: '#C7C7CC',
  pillTrack: '#F2F2F7',
  pillThumbActive: '#FFFFFF',
};

const darkTheme: Theme = {
  isDark: true,
  bg: '#000000',
  cardBg: '#1C1C1E',
  surfaceMuted: '#2C2C2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  accent: '#0A84FF',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  purple: '#5E5CE6',
  cyan: '#64D2FF',
  accentSoft: '#0A1F3F',
  successSoft: '#0F2A18',
  warningSoft: '#3A2811',
  dangerSoft: '#3A1414',
  purpleSoft: '#1A1A3A',
  cyanSoft: '#0B2A3A',
  tabBarBg: '#1C1C1E',
  tabBarBorder: '#38383A',
  chevron: '#48484A',
  pillTrack: '#2C2C2E',
  pillThumbActive: '#48484A',
};

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: 'system',
  setMode: () => {},
});

const STORAGE_KEY = 'walrus_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Load persisted preference once
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') setModeState(val);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m);
  };

  const theme = useMemo(() => {
    const effective = mode === 'system' ? (systemScheme ?? 'light') : mode;
    return effective === 'dark' ? darkTheme : lightTheme;
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

export function useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode) => void } {
  const { mode, setMode } = useContext(ThemeContext);
  return { mode, setMode };
}
