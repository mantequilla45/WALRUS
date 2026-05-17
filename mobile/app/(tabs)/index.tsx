import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Animated, Easing, Pressable, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { walrusAPI, type SensorReading, type DeviceCommands, type Override } from '@/services/api';
import { computeDeviceStatus } from '@/services/deviceStatus';
import { useTheme, type Theme } from '@/contexts/theme';
import { useAppSettings } from '@/contexts/appSettings';

type FocusKey = 'tds' | 'basin_temp' | 'activations';

export default function HomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const { settings: appSettings } = useAppSettings();
  const styles = useMemo(() => createStyles(t), [t]);

  const [data, setData] = useState<SensorReading | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commands, setCommands] = useState<DeviceCommands | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick every 5s so "X ago" labels and offline detection stay current
  useEffect(() => {
    const intv = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(intv);
  }, []);

  const goToAnalytics = (focus: FocusKey) =>
    router.push({ pathname: '/(tabs)/analytics', params: { focus } });

  // Peltier pulse animation (when heater is active)
  const peltierPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (data?.peltier_active) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(peltierPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(peltierPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      peltierPulse.setValue(0);
    }
  }, [data?.peltier_active]);
  const peltierScale = peltierPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

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
          <Ionicons name="water" size={32} color={t.accent} />
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

  const status = computeDeviceStatus(data, commands, now, appSettings.offlineThresholdSeconds * 1000);
  const offline = status.kind === 'offline' || status.kind === 'unknown' || status.kind === 'sleeping';
  const isSleeping = status.kind === 'sleeping';

  const togglePower = () => {
    const turningOff = !isSleeping;
    Alert.alert(
      turningOff ? 'Turn off device?' : 'Turn device back on?',
      turningOff
        ? 'The device will stop monitoring and enter deep sleep until the next scheduled wake.'
        : 'The device will resume normal monitoring on its next wake cycle.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: turningOff ? 'Turn off' : 'Turn on',
          style: turningOff ? 'destructive' : 'default',
          onPress: async () => {
            setCommands((prev) => (prev ? { ...prev, sleep: turningOff } : prev));
            const next = await walrusAPI.setDeviceCommands({ sleep: turningOff });
            if (next) setCommands(next);
          },
        },
      ]
    );
  };

  // Treat sentinel/out-of-range sensor values as "no reading" (ESP32 convention: 999 = error)
  const validNumber = (n: number | null, max: number, min: number = -100): number | null =>
    n === null || n >= 999 || n < min || n > max ? null : n;

  const tdsRaw = validNumber(data.tds_ppm, 5000, 0);
  const basinRaw = validNumber(data.basin_temp, 100);

  const tds = tdsRaw ?? 0;
  const basin = basinRaw ?? 0;
  const tdsMissing = tdsRaw === null;
  const basinMissing = basinRaw === null;
  const floatOk = data.float_water_detect === true;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
      }
      bounces
      alwaysBounceVertical
      overScrollMode="always"
      decelerationRate="normal"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dashboard</Text>
        </View>
        <StatusPill status={status} />
      </View>

      <Text style={styles.timestamp}>Updated {getTimeAgo()}</Text>

      {/* ── Power ── */}
      <Pressable
        onPress={togglePower}
        style={({ pressed }) => [
          styles.powerCard,
          isSleeping && styles.powerCardOff,
          pressed && { opacity: 0.85 },
        ]}
      >
        <View style={[styles.powerIcon, { backgroundColor: isSleeping ? t.dangerSoft : t.successSoft }]}>
          <Ionicons name="power" size={22} color={isSleeping ? t.danger : t.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.powerTitle}>{isSleeping ? 'Device is off' : 'Device is on'}</Text>
          <Text style={styles.powerSub}>
            {isSleeping ? 'Tap to turn on' : 'Tap to turn off'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.chevron} />
      </Pressable>

      {/* ── Water Quality ── */}
      <Text style={styles.sectionLabel}>Water Quality</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => goToAnalytics('tds')}
          disabled={offline}
          style={({ pressed }) => [styles.metricCard, offline && styles.metricCardOffline, pressed && !offline && styles.metricCardPressed]}
        >
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: t.accentSoft }]}>
              <MaterialCommunityIcons name="water-check" size={16} color={t.accent} />
            </View>
            <Text style={styles.metricLabel}>Purity (TDS)</Text>
            {!offline && <Ionicons name="chevron-forward" size={14} color={t.chevron} />}
          </View>
          <Text style={[styles.metricValue, (offline || tdsMissing) && styles.valueOff]}>
            {offline ? 0 : tdsMissing ? 0 : tds}
          </Text>
          <Text style={[
            styles.metricSub,
            !offline && !tdsMissing && (tds < appSettings.tdsCleanMax ? styles.subPositive : styles.subWarning),
          ]}>
            {offline ? 'No data' : tdsMissing ? 'Sensor error' :
              `${tds < appSettings.tdsCleanMax ? 'Clean' : tds < appSettings.tdsModerateMax ? 'Moderate' : 'Poor'} · ppm`}
          </Text>
        </Pressable>

      </View>

      {/* ── Sensors ── */}
      <Text style={styles.sectionLabel}>Sensors</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => goToAnalytics('basin_temp')}
          disabled={offline}
          style={({ pressed }) => [styles.metricCard, offline && styles.metricCardOffline, pressed && !offline && styles.metricCardPressed]}
        >
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: t.warningSoft }]}>
              <Ionicons name="flame" size={16} color={t.warning} />
            </View>
            <Text style={styles.metricLabel}>Basin Temp</Text>
            {!offline && <Ionicons name="chevron-forward" size={14} color={t.chevron} />}
          </View>
          <Text style={[styles.metricValue, (offline || basinMissing) && styles.valueOff]}>
            {offline ? '0.0°' : basinMissing ? '0.0°' : `${basin.toFixed(1)}°`}
          </Text>
          <Text style={[
            styles.metricSub,
            !offline && !basinMissing && (basin < appSettings.basinNormalMax ? styles.subPositive : styles.subWarning),
          ]}>
            {offline ? 'No data' : basinMissing ? 'Sensor error' :
              `${basin < appSettings.basinNormalMax ? 'Normal' : basin < appSettings.basinWarmMax ? 'Warm' : 'Hot'} · °C`}
          </Text>
        </Pressable>

        <View style={[styles.metricCard, offline && styles.metricCardOffline]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIcon, { backgroundColor: offline ? t.surfaceMuted : (floatOk ? t.successSoft : t.dangerSoft) }]}>
              <MaterialCommunityIcons
                name={offline ? 'water-off' : (floatOk ? 'water' : 'water-off')}
                size={16}
                color={offline ? t.chevron : (floatOk ? t.success : t.danger)}
              />
            </View>
            <Text style={styles.metricLabel}>Float Switch</Text>
          </View>
          <Text style={[styles.metricValue, (!floatOk || offline) && styles.valueOff]}>
            {offline ? 'DRY' : (floatOk ? 'OK' : 'DRY')}
          </Text>
          <Text style={[styles.metricSub, !offline && (floatOk ? styles.subPositive : styles.subWarning)]}>
            {offline ? 'No data' : (floatOk ? 'Water detected' : 'No water')}
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
          offline={offline}
          onPress={() => goToAnalytics('activations')}
        />
        <ActuatorStatusCard
          label="Collect"
          icon="water-pump-off"
          active={!!data.collect_pump_active}
          override={commands?.collect_pump_override}
          offline={offline}
          onPress={() => goToAnalytics('activations')}
        />
      </View>
      <View style={styles.row}>
        <ActuatorStatusCard
          label="Peltier"
          icon="radiator"
          active={!!data.peltier_active}
          override={commands?.peltier_override}
          offline={offline}
          animatedScale={data.peltier_active ? peltierScale : undefined}
          fullWidth
          onPress={() => goToAnalytics('activations')}
        />
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
  offline,
  animatedScale,
  fullWidth,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  override?: Override;
  offline?: boolean;
  animatedScale?: Animated.AnimatedInterpolation<number>;
  fullWidth?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  const expected = override === 'on' ? true : override === 'off' ? false : active;
  const pending = override && override !== 'auto' && expected !== active;

  const iconColor = offline ? t.chevron : active ? t.accent : t.chevron;
  const iconBg = offline ? t.surfaceMuted : active ? t.accentSoft : t.surfaceMuted;

  const iconWrapper = animatedScale && !offline ? (
    <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
      <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
    </Animated.View>
  ) : (
    <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
  );

  const body = (
    <>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
          {iconWrapper}
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
        {!offline && override && override !== 'auto' && (
          <View style={styles.overrideBadge}>
            <Text style={styles.overrideBadgeText}>{override.toUpperCase()}</Text>
          </View>
        )}
        {onPress && !offline && <Ionicons name="chevron-forward" size={14} color={t.chevron} />}
      </View>
      <Text style={[styles.metricValue, (offline || !active) && styles.valueOff]}>
        {offline ? 'OFF' : active ? 'ON' : 'OFF'}
      </Text>
      {offline ? (
        <Text style={styles.metricSub}>No data</Text>
      ) : pending ? (
        <View style={styles.pendingRow}>
          <Ionicons name="time-outline" size={11} color={t.warning} />
          <Text style={styles.pendingText}>Pending — applies on next sync</Text>
        </View>
      ) : (
        <Text style={[styles.metricSub, active ? styles.subPositive : {}]}>
          {active ? 'Active' : 'Idle'}
        </Text>
      )}
    </>
  );

  if (onPress && !offline) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.metricCard,
          fullWidth && { flex: 1 },
          pressed && styles.metricCardPressed,
        ]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.metricCard, fullWidth && { flex: 1 }, offline && styles.metricCardOffline]}>{body}</View>;
}

function StatusPill({ status }: { status: ReturnType<typeof computeDeviceStatus> }) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  return (
    <View style={[styles.statusPill, { backgroundColor: status.bgColor }]}>
      <Ionicons name={status.iconName as any} size={14} color={status.color} />
      <View>
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        {status.detail ? (
          <Text style={[styles.statusDetail, { color: status.color }]}>{status.detail}</Text>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    centered: { alignItems: 'center', justifyContent: 'center' },
    content: { paddingBottom: 34 },

    loadingIcon: {
      width: 60, height: 60, borderRadius: 16, backgroundColor: t.accentSoft,
      alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    loadingTitle: { fontSize: 22, fontWeight: '700', color: t.textPrimary, letterSpacing: 1.5 },
    loadingSubtitle: { fontSize: 13, color: t.textSecondary, marginTop: 4 },
    errorText: { fontSize: 13, color: t.danger, fontWeight: '500', marginTop: 20 },
    connectingText: { fontSize: 13, color: t.accent, marginTop: 20 },

    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 2,
    },
    greeting: { fontSize: 32, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5 },

    timestamp: { fontSize: 12, color: t.textTertiary, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 6 },

    sectionLabel: {
      fontSize: 16, fontWeight: '600', color: t.textPrimary,
      paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
    },
    row: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },

    metricCard: {
      flex: 1, backgroundColor: t.cardBg, borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.2 : 0.04, shadowRadius: 12, elevation: 2,
    },
    metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    metricIcon: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    metricLabel: { fontSize: 13, fontWeight: '500', color: t.textSecondary, flex: 1 },
    metricValue: {
      fontSize: 26, fontWeight: '700', color: t.textPrimary,
      fontVariant: ['tabular-nums'], letterSpacing: -0.5, marginBottom: 4,
    },
    valueOff: { color: t.chevron },
    metricSub: { fontSize: 12, fontWeight: '500', color: t.textTertiary },
    subPositive: { color: t.success },
    subWarning: { color: t.warning },

    overrideBadge: {
      backgroundColor: t.warning, borderRadius: 6,
      paddingHorizontal: 6, paddingVertical: 2,
    },
    overrideBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
    pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pendingText: { fontSize: 12, fontWeight: '500', color: t.warning },

    metricCardPressed: { opacity: 0.7 },
    metricCardOffline: { opacity: 0.55 },

    // Power toggle card
    powerCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginHorizontal: 16, marginTop: 10, marginBottom: 4,
      padding: 16,
      backgroundColor: t.cardBg, borderRadius: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.2 : 0.04, shadowRadius: 12, elevation: 2,
    },
    powerCardOff: {
      backgroundColor: t.surfaceMuted,
    },
    powerIcon: {
      width: 44, height: 44, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
    },
    powerTitle: { fontSize: 15, fontWeight: '600', color: t.textPrimary },
    powerSub: { fontSize: 12, color: t.textSecondary, marginTop: 2 },

    // Status pill (composite device status in header)
    statusPill: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
      maxWidth: 180,
    },
    statusLabel: { fontSize: 13, fontWeight: '700' },
    statusDetail: { fontSize: 10, fontWeight: '500', opacity: 0.8 },
  });
}
