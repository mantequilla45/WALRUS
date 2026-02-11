import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REFRESH_KEY = 'walrus_refresh_rate';
const REFRESH_OPTIONS = [
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
];
const DEFAULT_REFRESH = 5000;

export default function SettingsScreen() {
  const [refreshRate, setRefreshRate] = useState(DEFAULT_REFRESH);

  useEffect(() => {
    AsyncStorage.getItem(REFRESH_KEY).then((val: string | null) => {
      if (val) setRefreshRate(parseInt(val, 10));
    });
  }, []);

  const selectRate = async (value: number) => {
    setRefreshRate(value);
    await AsyncStorage.setItem(REFRESH_KEY, value.toString());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="settings-outline" size={24} color="#94a3b8" />
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      {/* Refresh Rate */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="timer-outline" size={18} color="#38bdf8" />
          <Text style={styles.sectionTitle}>Refresh Rate</Text>
        </View>
        <Text style={styles.sectionDesc}>
          How often the app fetches new data from the server.
        </Text>
        <View style={styles.optionsRow}>
          {REFRESH_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.optionBtn, refreshRate === opt.value && styles.optionBtnActive]}
              onPress={() => selectRate(opt.value)}
            >
              <Text style={[styles.optionLabel, refreshRate === opt.value && styles.optionLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={18} color="#64748b" />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Device</Text>
          <Text style={styles.aboutValue}>WALRUS_SIM</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080c14',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 20,
    backgroundColor: '#0b1120',
    borderBottomWidth: 1,
    borderBottomColor: '#141e30',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#111a2b',
    borderWidth: 1,
    borderColor: '#1a2540',
    alignItems: 'center',
  },
  optionBtnActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  optionLabelActive: {
    color: '#22d3ee',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#141e30',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  aboutValue: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
