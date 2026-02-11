import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, AppState } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SensorCard } from '@/components/SensorCard';
import { StatusBadge } from '@/components/StatusBadge';
import { BatteryIndicator } from '@/components/BatteryIndicator';
import { walrusAPI, type SensorReading } from '@/services/api';

const REFRESH_KEY = 'walrus_refresh_rate';
const DEFAULT_REFRESH = 5000;

export default function HomeScreen() {
  const [data, setData] = useState<SensorReading | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshRate, setRefreshRate] = useState(DEFAULT_REFRESH);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await walrusAPI.getLatest();
      if (response.success && response.data) {
        setData(response.data);
        setLastUpdate(new Date(response.data.created_at));
        setConnected(true);
        setError(null);
      } else {
        setError(response.message || 'No data available');
        setConnected(false);
      }
    } catch (e: any) {
      setError('Cannot reach server');
      setConnected(false);
    }
  }, []);

  // Load saved refresh rate
  useEffect(() => {
    AsyncStorage.getItem(REFRESH_KEY).then((val: string | null) => {
      if (val) setRefreshRate(parseInt(val, 10));
    });
  }, []);

  // Listen for refresh rate changes (from Settings screen)
  useEffect(() => {
    const listener = AppState.addEventListener('change', () => {
      AsyncStorage.getItem(REFRESH_KEY).then((val: string | null) => {
        if (val) setRefreshRate(parseInt(val, 10));
      });
    });
    return () => listener.remove();
  }, []);

  // Polling loop
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, refreshRate);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, refreshRate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getTDSStatus = (ppm: number) => {
    if (ppm < 300) return 'normal' as const;
    if (ppm < 500) return 'warning' as const;
    return 'critical' as const;
  };

  const getTempStatus = (temp: number) => {
    if (temp < 50) return 'normal' as const;
    if (temp < 55) return 'warning' as const;
    return 'critical' as const;
  };

  // Fallback when no data yet
  if (!data) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="water" size={48} color="#22d3ee" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>WALRUS</Text>
        {error ? (
          <>
            <Text style={[styles.subtitle, { color: '#f87171', marginTop: 12 }]}>{error}</Text>
            <Text style={[styles.subtitle, { marginTop: 6 }]}>
              Make sure the server is running and simulation is started.
            </Text>
          </>
        ) : (
          <Text style={[styles.subtitle, { marginTop: 12 }]}>Connecting to server...</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#22d3ee"
          colors={['#22d3ee']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="water" size={28} color="#22d3ee" />
          <Text style={styles.title}>WALRUS</Text>
        </View>
        <Text style={styles.subtitle}>Water Purification System</Text>
      </View>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <StatusBadge status={(data.system_state as any) || 'Idle'} />
        <View style={styles.statusRight}>
          <View style={[styles.connDot, connected && styles.connDotOnline]} />
          <Text style={styles.timestamp}>
            {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--'}
          </Text>
        </View>
      </View>

      {/* Battery & Solar */}
      <View style={styles.section}>
        <BatteryIndicator
          voltage={data.battery_voltage ?? 0}
          isCharging={(data.solar_current ?? 0) > 0.5}
        />

        <SensorCard
          label="Solar Current"
          value={(data.solar_current ?? 0).toFixed(2)}
          unit="A"
          icon={<Ionicons name="sunny" size={18} color="#fbbf24" />}
          status={(data.solar_current ?? 0) > 1.0 ? 'normal' : 'warning'}
        />
      </View>

      {/* Water Quality */}
      <View style={styles.sectionHeader}>
        <Ionicons name="water-outline" size={18} color="#38bdf8" />
        <Text style={styles.sectionTitle}>Water Quality</Text>
      </View>
      <View style={styles.grid}>
        <SensorCard
          label="Purity (TDS)"
          value={data.tds_ppm ?? 0}
          unit="ppm"
          icon={<MaterialCommunityIcons name="water-check" size={18} color="#22d3ee" />}
          status={getTDSStatus(data.tds_ppm ?? 0)}
          compact
        />
        <SensorCard
          label="Water Level"
          value={(data.water_level_cm ?? 0).toFixed(1)}
          unit="cm"
          icon={<Ionicons name="beaker-outline" size={18} color="#38bdf8" />}
          status={(data.water_level_cm ?? 0) > 10 ? 'normal' : 'warning'}
          compact
        />
      </View>

      {/* Temperature */}
      <View style={styles.sectionHeader}>
        <Ionicons name="thermometer-outline" size={18} color="#fb923c" />
        <Text style={styles.sectionTitle}>Temperature</Text>
      </View>
      <View style={styles.grid}>
        <SensorCard
          label="Basin"
          value={(data.basin_temp ?? 0).toFixed(1)}
          unit="°C"
          icon={<Ionicons name="flame" size={18} color="#fb923c" />}
          status={getTempStatus(data.basin_temp ?? 0)}
          compact
        />
        <SensorCard
          label="Condenser"
          value={(data.condenser_temp ?? 0).toFixed(1)}
          unit="°C"
          icon={<Ionicons name="snow" size={18} color="#67e8f9" />}
          status="normal"
          compact
        />
      </View>

      {/* Actuators */}
      <View style={styles.sectionHeader}>
        <Ionicons name="cog-outline" size={18} color="#94a3b8" />
        <Text style={styles.sectionTitle}>Actuators</Text>
      </View>
      <View style={styles.grid}>
        <View style={[styles.actuatorCard, data.pump_active && styles.actuatorActive]}>
          <View style={[styles.actuatorIconWrap, data.pump_active && styles.actuatorIconActive]}>
            <MaterialCommunityIcons
              name="water-pump"
              size={24}
              color={data.pump_active ? '#34d399' : '#475569'}
            />
          </View>
          <Text style={styles.actuatorLabel}>Pump</Text>
          <View style={[styles.actuatorStatusPill, data.pump_active && styles.pillActive]}>
            <View style={[styles.pillDot, data.pump_active && styles.pillDotActive]} />
            <Text style={[styles.actuatorStatusText, data.pump_active && styles.statusTextActive]}>
              {data.pump_active ? 'ON' : 'OFF'}
            </Text>
          </View>
        </View>

        <View style={[styles.actuatorCard, data.fan_active && styles.actuatorActive]}>
          <View style={[styles.actuatorIconWrap, data.fan_active && styles.actuatorIconActive]}>
            <MaterialCommunityIcons
              name="fan"
              size={24}
              color={data.fan_active ? '#34d399' : '#475569'}
            />
          </View>
          <Text style={styles.actuatorLabel}>Fan</Text>
          <View style={[styles.actuatorStatusPill, data.fan_active && styles.pillActive]}>
            <View style={[styles.pillDot, data.fan_active && styles.pillDotActive]} />
            <Text style={[styles.actuatorStatusText, data.fan_active && styles.statusTextActive]}>
              {data.fan_active ? 'ON' : 'OFF'}
            </Text>
          </View>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="pulse-outline" size={14} color="#64748b" />
        <Text style={styles.infoText}>
          Live data — Refreshing every {refreshRate / 1000}s
        </Text>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080c14',
  },
  content: {
    paddingBottom: 20,
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
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#536178',
    marginLeft: 38,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  connDotOnline: {
    backgroundColor: '#22c55e',
  },
  timestamp: {
    fontSize: 12,
    color: '#475569',
    fontVariant: ['tabular-nums'],
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  actuatorCard: {
    flex: 1,
    backgroundColor: '#111a2b',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  actuatorActive: {
    borderColor: '#14533d',
    backgroundColor: '#0a1a15',
  },
  actuatorIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1a2540',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actuatorIconActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  actuatorLabel: {
    fontSize: 13,
    color: '#8494a7',
    fontWeight: '500',
    marginBottom: 8,
  },
  actuatorStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#1a2540',
    gap: 6,
  },
  pillActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  pillDotActive: {
    backgroundColor: '#34d399',
  },
  actuatorStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#34d399',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 10,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#141e30',
  },
  infoText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  footer: {
    height: 20,
  },
});
