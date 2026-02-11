import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { SensorCard } from '@/components/SensorCard';
import { StatusBadge } from '@/components/StatusBadge';
import { BatteryIndicator } from '@/components/BatteryIndicator';
import { walrusAPI, type SensorReading } from '@/services/api';

export default function HomeScreen() {
  const [data, setData] = useState<SensorReading | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fan spin animation
  const fanSpin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (data?.fan_active) {
      const anim = Animated.loop(
        Animated.timing(fanSpin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
      );
      anim.start();
      return () => anim.stop();
    } else {
      fanSpin.setValue(0);
    }
  }, [data?.fan_active]);
  const fanRotate = fanSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Solar spin animation
  const solarSpin = useRef(new Animated.Value(0)).current;
  const solarHigh = (data?.solar_current ?? 0) > 1.0;
  useEffect(() => {
    if (solarHigh) {
      const anim = Animated.loop(
        Animated.timing(solarSpin, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
      );
      anim.start();
      return () => anim.stop();
    } else {
      solarSpin.setValue(0);
    }
  }, [solarHigh]);
  const solarRotate = solarSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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
      setError('Cannot connect to database');
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = walrusAPI.subscribeToReadings((reading) => {
      setData(reading);
      setLastUpdate(new Date(reading.created_at));
      setConnected(true);
      setError(null);
    });
    return () => unsubscribe();
  }, [fetchData]);

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

  const getTimeAgo = () => {
    if (!lastUpdate) return '';
    const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdate.toLocaleTimeString();
  };

  // Loading / Error state
  if (!data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.loadingIcon}>
          <Ionicons name="water" size={32} color="#007AFF" />
        </View>
        <Text style={styles.loadingTitle}>WALRUS</Text>
        <Text style={styles.loadingSubtitle}>Water Purification System</Text>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.connectingText}>Connecting...</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dashboard</Text>
        </View>
        <StatusBadge status={(data.system_state as any) || 'Idle'} />
      </View>

      {/* ── Updated timestamp ── */}
      <Text style={styles.timestamp}>Updated {getTimeAgo()}</Text>

      {/* ── Power ── */}
      <Text style={styles.sectionLabel}>Power</Text>
      <View style={styles.row}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={styles.lottieWrap}>
              <LottieView
                source={require('@/assets/icons/animated/wired-outline-2765-battery-levels-vertical-hover-pinch.json')}
                autoPlay={(data.solar_current ?? 0) > 0.5}
                loop={(data.solar_current ?? 0) > 0.5}
                speed={0.8}
                style={{ width: 28, height: 28, transform: [{ rotate: '90deg' }] }}
              />
            </View>
            <Text style={styles.metricLabel}>Battery</Text>
          </View>
          <Text style={styles.metricValue}>{(data.battery_voltage ?? 0).toFixed(1)}V</Text>
          <Text style={styles.metricSub}>
            {Math.round(Math.min(100, Math.max(0, (((data.battery_voltage ?? 0) - 11) / 1.6) * 100)))}% charged
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: '#E8F8ED' }]}>
              <Animated.View style={solarHigh ? { transform: [{ rotate: solarRotate }] } : undefined}>
                <Ionicons name="sunny" size={16} color="#34C759" />
              </Animated.View>
            </View>
            <Text style={styles.metricLabel}>Solar</Text>
          </View>
          <Text style={styles.metricValue}>{(data.solar_current ?? 0).toFixed(2)}A</Text>
          <Text style={[styles.metricSub, (data.solar_current ?? 0) > 1 ? styles.subPositive : styles.subWarning]}>
            {(data.solar_current ?? 0) > 1 ? 'Generating' : 'Low output'}
          </Text>
        </View>
      </View>

      {/* ── Water Quality ── */}
      <Text style={styles.sectionLabel}>Water Quality</Text>
      <View style={styles.row}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: '#EBF5FF' }]}>
              <MaterialCommunityIcons name="water-check" size={16} color="#007AFF" />
            </View>
            <Text style={styles.metricLabel}>Purity (TDS)</Text>
          </View>
          <Text style={styles.metricValue}>{data.tds_ppm ?? 0}</Text>
          <Text style={[
            styles.metricSub,
            (data.tds_ppm ?? 0) < 300 ? styles.subPositive : styles.subWarning
          ]}>
            {(data.tds_ppm ?? 0) < 300 ? 'Clean' : (data.tds_ppm ?? 0) < 500 ? 'Moderate' : 'Poor'} · ppm
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="water-outline" size={16} color="#5AC8FA" />
            </View>
            <Text style={styles.metricLabel}>Water Level</Text>
          </View>
          <Text style={styles.metricValue}>{(data.water_level_cm ?? 0).toFixed(1)}</Text>
          <Text style={[
            styles.metricSub,
            (data.water_level_cm ?? 0) > 10 ? styles.subPositive : styles.subWarning
          ]}>
            {(data.water_level_cm ?? 0) > 10 ? 'Normal' : 'Low'} · cm
          </Text>
        </View>
      </View>

      {/* ── Temperature ── */}
      <Text style={styles.sectionLabel}>Temperature</Text>
      <View style={styles.row}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="flame" size={16} color="#FF9500" />
            </View>
            <Text style={styles.metricLabel}>Basin</Text>
          </View>
          <Text style={styles.metricValue}>{(data.basin_temp ?? 0).toFixed(1)}°</Text>
          <Text style={[
            styles.metricSub,
            (data.basin_temp ?? 0) < 50 ? styles.subPositive : styles.subWarning
          ]}>
            {(data.basin_temp ?? 0) < 50 ? 'Normal' : (data.basin_temp ?? 0) < 55 ? 'Warm' : 'Hot'} · °C
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="snow" size={16} color="#5AC8FA" />
            </View>
            <Text style={styles.metricLabel}>Condenser</Text>
          </View>
          <Text style={styles.metricValue}>{(data.condenser_temp ?? 0).toFixed(1)}°</Text>
          <Text style={[styles.metricSub, styles.subPositive]}>Normal · °C</Text>
        </View>
      </View>

      {/* ── Actuators ── */}
      <Text style={styles.sectionLabel}>Actuators</Text>
      <View style={styles.row}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: data.pump_active ? '#EBF5FF' : '#F2F2F7' }]}>
              <MaterialCommunityIcons
                name="water-pump"
                size={16}
                color={data.pump_active ? '#007AFF' : '#C7C7CC'}
              />
            </View>
            <Text style={styles.metricLabel}>Pump</Text>
          </View>
          <Text style={[styles.metricValue, !data.pump_active && styles.valueOff]}>
            {data.pump_active ? 'ON' : 'OFF'}
          </Text>
          <Text style={[styles.metricSub, data.pump_active ? styles.subPositive : {}]}>
            {data.pump_active ? 'Active' : 'Idle'}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: data.fan_active ? '#EBF5FF' : '#F2F2F7' }]}>
              <Animated.View style={data.fan_active ? { transform: [{ rotate: fanRotate }] } : undefined}>
                <MaterialCommunityIcons
                  name="fan"
                  size={16}
                  color={data.fan_active ? '#007AFF' : '#C7C7CC'}
                />
              </Animated.View>
            </View>
            <Text style={styles.metricLabel}>Fan</Text>
          </View>
          <Text style={[styles.metricValue, !data.fan_active && styles.valueOff]}>
            {data.fan_active ? 'ON' : 'OFF'}
          </Text>
          <Text style={[styles.metricSub, data.fan_active ? styles.subPositive : {}]}>
            {data.fan_active ? 'Active' : 'Idle'}
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 34,
  },

  // ── Loading ──
  loadingIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 1.5,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500',
    marginTop: 20,
  },
  connectingText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 20,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 3,
  },

  // ── Timestamp ──
  timestamp: {
    fontSize: 12,
    color: '#AEAEB2',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 6,
  },

  // ── Sections ──
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },

  // ── Metric Card (Aura style) ──
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E8F8ED',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    flex: 1,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  valueOff: {
    color: '#C7C7CC',
  },
  metricSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#AEAEB2',
  },
  subPositive: {
    color: '#34C759',
  },
  subWarning: {
    color: '#FF9F0A',
  },
});
