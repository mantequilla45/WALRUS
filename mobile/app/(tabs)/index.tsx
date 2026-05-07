import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Animated, Easing, Pressable, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBadge } from '@/components/StatusBadge';
import { walrusAPI, type SensorReading, type DeviceCommands, type Override } from '@/services/api';

type OverrideKey = 'intake_pump_override' | 'collect_pump_override' | 'mist_override';

export default function HomeScreen() {
  const [data, setData] = useState<SensorReading | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commands, setCommands] = useState<DeviceCommands | null>(null);

  // Mist pulse animation
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
    walrusAPI.getDeviceCommands().then((c) => c && setCommands(c));

    const unsubscribeReadings = walrusAPI.subscribeToReadings((reading) => {
      setData(reading);
      setLastUpdate(new Date(reading.created_at));
      setError(null);
    });
    const unsubscribeCommands = walrusAPI.subscribeToDeviceCommands((c) => setCommands(c));

    return () => {
      unsubscribeReadings();
      unsubscribeCommands();
    };
  }, [fetchData]);

  const setOverride = async (key: OverrideKey, value: Override) => {
    setCommands((prev) => (prev ? { ...prev, [key]: value } : prev));
    const next = await walrusAPI.setDeviceCommands({ [key]: value } as Partial<DeviceCommands>);
    if (next) setCommands(next);
  };

  const setSleep = async (sleep: boolean) => {
    setCommands((prev) => (prev ? { ...prev, sleep } : prev));
    const next = await walrusAPI.setDeviceCommands({ sleep });
    if (next) setCommands(next);
  };

  const resetAll = async () => {
    setCommands((prev) =>
      prev
        ? { ...prev, sleep: false, intake_pump_override: 'auto', collect_pump_override: 'auto', mist_override: 'auto' }
        : prev
    );
    const next = await walrusAPI.setDeviceCommands({
      sleep: false,
      intake_pump_override: 'auto',
      collect_pump_override: 'auto',
      mist_override: 'auto',
    });
    if (next) setCommands(next);
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
  const anyOverride =
    (commands?.intake_pump_override && commands.intake_pump_override !== 'auto') ||
    (commands?.collect_pump_override && commands.collect_pump_override !== 'auto') ||
    (commands?.mist_override && commands.mist_override !== 'auto') ||
    commands?.sleep;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
      }
    >
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

      {/* ── Actuator status ── */}
      <Text style={styles.sectionLabel}>Actuators</Text>
      <View style={styles.row}>
        <ActuatorStatusCard
          label="Intake"
          icon="water-pump"
          active={!!data.intake_pump_active}
          override={commands?.intake_pump_override}
        />
        <ActuatorStatusCard
          label="Collect"
          icon="water-pump-off"
          active={!!data.collect_pump_active}
          override={commands?.collect_pump_override}
        />
      </View>
      <View style={styles.row}>
        <View style={[styles.metricCard, { flex: 1 }]}>
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
            {commands?.mist_override && commands.mist_override !== 'auto' && (
              <View style={styles.overrideBadge}>
                <Text style={styles.overrideBadgeText}>{commands.mist_override.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.metricValue, !data.mist_active && styles.valueOff]}>
            {data.mist_active ? 'ON' : 'OFF'}
          </Text>
          <Text style={[styles.metricSub, data.mist_active ? styles.subPositive : {}]}>
            {data.mist_active ? 'Distilling' : 'Idle'}
          </Text>
        </View>
      </View>

      {/* ── Manual Controls ── */}
      <View style={styles.controlsHeader}>
        <Text style={styles.sectionLabel}>Manual Controls</Text>
        {anyOverride ? (
          <Pressable onPress={resetAll} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset all to Auto</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.controlsHint}>
        Commands take effect on the next ESP32 sync (~15s).
      </Text>

      <View style={styles.controlCard}>
        <OverrideRow
          label="Intake Pump"
          value={commands?.intake_pump_override ?? 'auto'}
          onChange={(v) => setOverride('intake_pump_override', v)}
        />
        <View style={styles.divider} />
        <OverrideRow
          label="Collection Pump"
          value={commands?.collect_pump_override ?? 'auto'}
          onChange={(v) => setOverride('collect_pump_override', v)}
        />
        <View style={styles.divider} />
        <OverrideRow
          label="Mister"
          value={commands?.mist_override ?? 'auto'}
          onChange={(v) => setOverride('mist_override', v)}
        />
        <View style={styles.divider} />
        <View style={styles.sleepRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.controlRowLabel}>Sleep Device</Text>
            <Text style={styles.controlRowSub}>ESP32 sleeps until next wake window</Text>
          </View>
          <Switch
            value={!!commands?.sleep}
            onValueChange={setSleep}
            trackColor={{ false: '#E5E5EA', true: '#FF9500' }}
          />
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function ActuatorStatusCard({
  label,
  icon,
  active,
  override,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  override?: Override;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: active ? '#EBF5FF' : '#F2F2F7' }]}>
          <MaterialCommunityIcons name={icon} size={16} color={active ? '#007AFF' : '#C7C7CC'} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
        {override && override !== 'auto' && (
          <View style={styles.overrideBadge}>
            <Text style={styles.overrideBadgeText}>{override.toUpperCase()}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.metricValue, !active && styles.valueOff]}>{active ? 'ON' : 'OFF'}</Text>
      <Text style={[styles.metricSub, active ? styles.subPositive : {}]}>
        {active ? 'Active' : 'Idle'}
      </Text>
    </View>
  );
}

function OverrideRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Override;
  onChange: (v: Override) => void;
}) {
  return (
    <View style={styles.controlRow}>
      <Text style={styles.controlRowLabel}>{label}</Text>
      <View style={styles.pillGroup}>
        {(['auto', 'on', 'off'] as Override[]).map((opt) => {
          const active = value === opt;
          const activeBgStyle =
            opt === 'on' ? styles.pillOn : opt === 'off' ? styles.pillOff : styles.pillAuto;
          const activeTextStyle =
            opt === 'auto' ? styles.pillTextActiveDark : styles.pillTextActiveLight;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.pill, active && activeBgStyle]}
            >
              <Text style={[styles.pillText, active && activeTextStyle]}>
                {opt.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 34 },

  loadingIcon: {
    width: 60, height: 60, borderRadius: 16, backgroundColor: '#EBF5FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  loadingTitle: { fontSize: 22, fontWeight: '700', color: '#1C1C1E', letterSpacing: 1.5 },
  loadingSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  errorText: { fontSize: 13, color: '#FF3B30', fontWeight: '500', marginTop: 20 },
  connectingText: { fontSize: 13, color: '#007AFF', marginTop: 20 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 2,
  },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },

  timestamp: { fontSize: 12, color: '#AEAEB2', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 6 },

  sectionLabel: {
    fontSize: 16, fontWeight: '600', color: '#1C1C1E',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
  },
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 4 },

  metricCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  metricIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  metricLabel: { fontSize: 13, fontWeight: '500', color: '#8E8E93', flex: 1 },
  metricValue: {
    fontSize: 26, fontWeight: '700', color: '#1C1C1E',
    fontVariant: ['tabular-nums'], letterSpacing: -0.5, marginBottom: 4,
  },
  valueOff: { color: '#C7C7CC' },
  metricSub: { fontSize: 12, fontWeight: '500', color: '#AEAEB2' },
  subPositive: { color: '#34C759' },
  subWarning: { color: '#FF9F0A' },

  overrideBadge: {
    backgroundColor: '#FF9500', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  overrideBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },

  // ── Controls ──
  controlsHeader: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingRight: 20,
  },
  controlsHint: { fontSize: 12, color: '#8E8E93', paddingHorizontal: 20, paddingBottom: 10 },
  controlCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  controlRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sleepRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4,
  },
  controlRowLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  controlRowSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },

  pillGroup: { flexDirection: 'row', gap: 4, backgroundColor: '#F2F2F7', borderRadius: 999, padding: 3 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, minWidth: 44, alignItems: 'center' },
  pillAuto: { backgroundColor: '#FFFFFF' },
  pillOn:   { backgroundColor: '#34C759' },
  pillOff:  { backgroundColor: '#FF3B30' },
  pillText: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.3 },
  pillTextActiveDark: { color: '#1C1C1E' },
  pillTextActiveLight: { color: '#FFFFFF' },

  resetBtn: { paddingVertical: 18, paddingHorizontal: 4 },
  resetText: { fontSize: 13, color: '#007AFF', fontWeight: '500' },
});
