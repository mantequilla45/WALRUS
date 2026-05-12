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
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>App preferences and device info</Text>

      {/* ── Refresh Rate ── */}
      <Text style={styles.sectionLabel}>Refresh Rate</Text>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: '#EBF5FF' }]}>
            <Ionicons name="timer-outline" size={16} color="#007AFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>How often to fetch</Text>
            <Text style={styles.cardSubtitle}>
              Lower = more responsive, slightly more battery.
            </Text>
          </View>
        </View>

        <View style={styles.pillGroup}>
          {REFRESH_OPTIONS.map((opt) => {
            const active = refreshRate === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => selectRate(opt.value)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── About ── */}
      <Text style={styles.sectionLabel}>About</Text>
      <View style={styles.card}>
        <Row label="App version" value="1.0.0" />
        <Divider />
        <Row label="Device ID" value="WALRUS_001" />
        <Divider />
        <Row label="System" value="WALRUS Water Purifier" />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { paddingBottom: 34 },

  title: {
    fontSize: 32, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5,
    paddingHorizontal: 20, paddingTop: 60,
  },
  subtitle: {
    fontSize: 13, color: '#8E8E93',
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8,
  },

  sectionLabel: {
    fontSize: 16, fontWeight: '600', color: '#1C1C1E',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15, fontWeight: '600', color: '#1C1C1E',
  },
  cardSubtitle: {
    fontSize: 12, color: '#8E8E93', marginTop: 2,
  },

  // Pill group
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  pillText: {
    fontSize: 14, fontWeight: '600', color: '#8E8E93',
  },
  pillTextActive: {
    color: '#007AFF',
  },

  // About rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLabel: { fontSize: 14, color: '#8E8E93' },
  rowValue: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
});
