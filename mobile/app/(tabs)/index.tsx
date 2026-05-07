import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Animated, Easing, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBadge } from '@/components/StatusBadge';
import { walrusAPI, type SensorReading, type DeviceState, type DeviceMode } from '@/services/api';

type DesiredKey = 'desired_intake_pump' | 'desired_collect_pump' | 'desired_mist';

export default function HomeScreen() {
  const [data, setData] = useState<SensorReading | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);

  // Mist pulse animation (active when mist_active is true)
  const mistPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (data?.mist_active) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(mistPulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(mistPulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      mistPulse.setValue(0);
    }
  }, [data?.mist_active]);
  const mistScale = mistPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const fetchData = useCallback(async () => {
    try {
      const response = await walrusAPI.getLatest();
      if (response.success && response.data) {
        setData(response.data);
        setLastUpdate(new Date(response.data.created_at));
        setError(null);
      } else {
        setError(response.message || 'Waiting for first reading');
      }
    } catch (e: any) {
      setError('Cannot connect to database');
    }
  }, []);

  useEffect(() => {
    fetchData();
    walrusAPI.getDeviceState().then((s) => s && setDeviceState(s));

    const unsubscribeReadings = walrusAPI.subscribeToReadings((reading) => {
      setData(reading);
      setLastUpdate(new Date(reading.created_at));
      setError(null);
    });
    const unsubscribeState = walrusAPI.subscribeToDeviceState((s) => setDeviceState(s));

    return () => {
      unsubscribeReadings();
      unsubscribeState();
    };
  }, [fetchData]);

  const isManual = deviceState?.mode === 'manual';

  const setMode = async (mode: DeviceMode) => {
    setDeviceState((prev) => (prev ? { ...prev, mode } : prev));
    const next = await walrusAPI.setDeviceState({ mode });
    if (next) setDeviceState(next);
  };

  const toggleDesired = async (key: DesiredKey) => {
    if (!isManual) return;
    const current = deviceState?.[key] ?? false;
    setDeviceState((prev) => (prev ? { ...prev, [key]: !current } : prev));
    const next = await walrusAPI.setDeviceState({ [key]: !current } as Partial<DeviceState>);
    if (next) setDeviceState(next);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getTimeAgo = () => {
    if (!lastUpdate) return '';
    const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdate.toLocaleTimeString();
  };

  // Loading / waiting-for-first-reading state
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

  const tds = data.tds_ppm ?? 0;
  const cleanLevel = data.clean_level_cm ?? 0;
  const basin = data.basin_temp ?? 0;
  const floatOk = data.float_water_detect === true;

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
        <StatusBadge status={(data.state as any) || 'Idle'} />
      </View>

      <Text style={styles.timestamp}>Updated {getTimeAgo()}</Text>

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
          <Text style={styles.metricValue}>{tds}</Text>
          <Text style={[
            styles.metricSub,
            tds < 300 ? styles.subPositive : styles.subWarning,
          ]}>
            {tds < 300 ? 'Clean' : tds < 500 ? 'Moderate' : 'Poor'} · ppm
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="water-outline" size={16} color="#5AC8FA" />
            </View>
            <Text style={styles.metricLabel}>Clean Level</Text>
          </View>
          <Text style={styles.metricValue}>{cleanLevel.toFixed(1)}</Text>
          <Text style={[
            styles.metricSub,
            cleanLevel > 5 ? styles.subPositive : styles.subWarning,
          ]}>
            {cleanLevel > 5 ? 'Collected' : 'Low'} · cm
          </Text>
        </View>
      </View>

      {/* ── Sensors ── */}
      <Text style={styles.sectionLabel}>Sensors</Text>
      <View style={styles.row}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="flame" size={16} color="#FF9500" />
            </View>
            <Text style={styles.metricLabel}>Basin Temp</Text>
          </View>
          <Text style={styles.metricValue}>{basin.toFixed(1)}°</Text>
          <Text style={[
            styles.metricSub,
            basin < 50 ? styles.subPositive : styles.subWarning,
          ]}>
            {basin < 50 ? 'Normal' : basin < 55 ? 'Warm' : 'Hot'} · °C
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: floatOk ? '#E8F8ED' : '#FFEBEB' }]}>
              <MaterialCommunityIcons
                name={floatOk ? 'water' : 'water-off'}
                size={16}
                color={floatOk ? '#34C759' : '#FF3B30'}
              />
            </View>
            <Text style={styles.metricLabel}>Float Switch</Text>
          </View>
          <Text style={[styles.metricValue, !floatOk && styles.valueOff]}>
            {floatOk ? 'OK' : 'DRY'}
          </Text>
          <Text style={[styles.metricSub, floatOk ? styles.subPositive : styles.subWarning]}>
            {floatOk ? 'Water detected' : 'No water'}
          </Text>
        </View>
      </View>

      {/* ── Controls ── */}
      <View style={styles.controlsHeader}>
        <Text style={styles.sectionLabel}>Controls</Text>
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => setMode('auto')}
            style={[styles.modePill, !isManual && styles.modePillActive]}
          >
            <Text style={[styles.modePillText, !isManual && styles.modePillTextActive]}>Auto</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('manual')}
            style={[styles.modePill, isManual && styles.modePillActiveManual]}
          >
            <Text style={[styles.modePillText, isManual && styles.modePillTextManual]}>Manual</Text>
          </Pressable>
        </View>
      </View>
      {isManual && (
        <Text style={styles.manualHint}>
          Manual mode — actuators obey your taps. Device may take a few seconds to respond.
        </Text>
      )}

      {/* Pumps row */}
      <View style={styles.row}>
        <ActuatorCard
          label="Intake Pump"
          icon="water-pump"
          active={!!data.intake_pump_active}
          desired={!!deviceState?.desired_intake_pump}
          isManual={isManual}
          onPress={() => toggleDesired('desired_intake_pump')}
        />
        <ActuatorCard
          label="Collect Pump"
          icon="water-pump-off"
          active={!!data.collect_pump_active}
          desired={!!deviceState?.desired_collect_pump}
          isManual={isManual}
          onPress={() => toggleDesired('desired_collect_pump')}
        />
      </View>

      {/* Mist row (full width) */}
      <View style={styles.row}>
        <Pressable
          disabled={!isManual}
          onPress={() => toggleDesired('desired_mist')}
          style={({ pressed }) => [
            styles.metricCard,
            { flex: 1 },
            isManual && styles.metricCardManual,
            pressed && isManual && styles.metricCardPressed,
          ]}
        >
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: data.mist_active ? '#EBF5FF' : '#F2F2F7' }]}>
              <Animated.View style={data.mist_active ? { transform: [{ scale: mistScale }] } : undefined}>
                <MaterialCommunityIcons
                  name="weather-fog"
                  size={16}
                  color={data.mist_active ? '#007AFF' : '#C7C7CC'}
                />
              </Animated.View>
            </View>
            <Text style={styles.metricLabel}>Mister</Text>
          </View>
          <Text style={[styles.metricValue, !data.mist_active && styles.valueOff]}>
            {data.mist_active ? 'ON' : 'OFF'}
          </Text>
          <Text style={[styles.metricSub, data.mist_active ? styles.subPositive : {}]}>
            {isManual
              ? `Desired: ${deviceState?.desired_mist ? 'ON' : 'OFF'} · tap to toggle`
              : data.mist_active ? 'Distilling' : 'Idle'}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function ActuatorCard({
  label,
  icon,
  active,
  desired,
  isManual,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  desired: boolean;
  isManual: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={!isManual}
      onPress={onPress}
      style={({ pressed }) => [
        styles.metricCard,
        isManual && styles.metricCardManual,
        pressed && isManual && styles.metricCardPressed,
      ]}
    >
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: active ? '#EBF5FF' : '#F2F2F7' }]}>
          <MaterialCommunityIcons name={icon} size={16} color={active ? '#007AFF' : '#C7C7CC'} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, !active && styles.valueOff]}>{active ? 'ON' : 'OFF'}</Text>
      <Text style={[styles.metricSub, active ? styles.subPositive : {}]}>
        {isManual ? `Desired: ${desired ? 'ON' : 'OFF'} · tap to toggle` : active ? 'Active' : 'Idle'}
      </Text>
    </Pressable>
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
    marginBottom: 4,
  },

  // ── Metric Card ──
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

  // ── Controls / Mode toggle ──
  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 999,
    padding: 3,
  },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  modePillActiveManual: {
    backgroundColor: '#FF9500',
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modePillTextActive: {
    color: '#1C1C1E',
  },
  modePillTextManual: {
    color: '#FFFFFF',
  },
  manualHint: {
    fontSize: 12,
    color: '#FF9500',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  metricCardManual: {
    borderWidth: 1.5,
    borderColor: '#FF9500',
  },
  metricCardPressed: {
    opacity: 0.7,
  },
});
