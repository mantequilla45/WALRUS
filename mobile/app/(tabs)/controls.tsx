import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { walrusAPI, type DeviceCommands, type Override, type SensorReading } from '@/services/api';
import { computeDeviceStatus } from '@/services/deviceStatus';

type OverrideKey = 'intake_pump_override' | 'collect_pump_override' | 'mist_override';

export default function ControlsScreen() {
  const [commands, setCommands] = useState<DeviceCommands | null>(null);
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    walrusAPI.getDeviceCommands().then((c) => c && setCommands(c));
    walrusAPI.getLatest().then((r) => r.data && setReading(r.data));

    const unsubCommands = walrusAPI.subscribeToDeviceCommands((c) => setCommands(c));
    const unsubReadings = walrusAPI.subscribeToReadings((r) => setReading(r));

    const tick = setInterval(() => setNow(Date.now()), 5000);

    return () => {
      unsubCommands();
      unsubReadings();
      clearInterval(tick);
    };
  }, []);

  const status = computeDeviceStatus(reading, commands, now);
  const locked = status.kind === 'offline' || status.kind === 'unknown';

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

  const anyOverride =
    (commands?.intake_pump_override && commands.intake_pump_override !== 'auto') ||
    (commands?.collect_pump_override && commands.collect_pump_override !== 'auto') ||
    (commands?.mist_override && commands.mist_override !== 'auto') ||
    commands?.sleep;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      bounces
      alwaysBounceVertical
      overScrollMode="always"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Controls</Text>
      <Text style={styles.subtitle}>Override automatic actuator behavior.</Text>

      {/* Status banner — tells the user whether commands will apply right away */}
      <View style={[styles.statusBanner, { backgroundColor: status.bgColor }]}>
        <Ionicons name={status.iconName as any} size={20} color={status.color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusBannerTitle, { color: status.color }]}>
            {status.label}{status.detail ? ` — ${status.detail}` : ''}
          </Text>
          <Text style={styles.statusBannerHint}>
            {bannerMessage(status.kind)}
          </Text>
        </View>
      </View>

      {/* Actuator override cards */}
      <ActuatorCard
        label="Intake Pump"
        icon="water-pump"
        value={commands?.intake_pump_override ?? 'auto'}
        onChange={(v) => setOverride('intake_pump_override', v)}
        disabled={locked}
      />
      <ActuatorCard
        label="Collection Pump"
        icon="water-pump-off"
        value={commands?.collect_pump_override ?? 'auto'}
        onChange={(v) => setOverride('collect_pump_override', v)}
        disabled={locked}
      />
      <ActuatorCard
        label="Mister"
        icon="weather-fog"
        value={commands?.mist_override ?? 'auto'}
        onChange={(v) => setOverride('mist_override', v)}
        disabled={locked}
      />

      {/* Sleep */}
      <Text style={styles.sectionLabel}>System</Text>
      <View style={[styles.sleepCard, locked && styles.disabled]} pointerEvents={locked ? 'none' : 'auto'}>
        <View style={[styles.iconWrap, { backgroundColor: commands?.sleep ? '#F0F4FF' : '#F2F2F7' }]}>
          <Ionicons name="moon" size={18} color={commands?.sleep ? '#5856D6' : '#8E8E93'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sleepLabel}>Sleep Device</Text>
          <Text style={styles.sleepSub}>ESP32 sleeps until the next wake window</Text>
        </View>
        <Switch
          value={!!commands?.sleep}
          onValueChange={setSleep}
          disabled={locked}
          trackColor={{ false: '#E5E5EA', true: '#5856D6' }}
        />
      </View>

      {anyOverride && !locked ? (
        <Pressable onPress={resetAll} style={styles.resetBtn}>
          <Ionicons name="refresh" size={16} color="#FF3B30" />
          <Text style={styles.resetText}>Reset all to Auto</Text>
        </Pressable>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function bannerMessage(kind: string): string {
  switch (kind) {
    case 'active':
      return 'Device is online. Commands apply on next sync (~15s).';
    case 'idle':
      return 'Device is online. Commands apply on next sync (~15s).';
    case 'sleeping':
      return 'Device is sleeping. Commands will queue and apply when it wakes.';
    case 'offline':
      return 'Device is offline. Controls are locked until it reconnects.';
    case 'fault':
      return 'Device reports a fault. Use overrides carefully.';
    default:
      return 'Waiting for device to check in...';
  }
}

// ────────────────────────────────────────────────────────────────
// Actuator override card with three big square buttons (Auto / On / Off)
// ────────────────────────────────────────────────────────────────

function ActuatorCard({
  label,
  icon,
  value,
  onChange,
  disabled,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: Override;
  onChange: (v: Override) => void;
  disabled?: boolean;
}) {
  const isOverridden = value !== 'auto';

  return (
    <View style={[styles.actuatorCard, disabled && styles.disabled]}>
      <View style={styles.actuatorHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#EBF5FF' }]}>
          <MaterialCommunityIcons name={icon} size={18} color="#007AFF" />
        </View>
        <Text style={styles.actuatorLabel}>{label}</Text>
        {isOverridden && (
          <View style={styles.overrideBadge}>
            <Text style={styles.overrideBadgeText}>{value.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.btnRow}>
        <SquareButton
          variant="auto"
          icon="sync"
          label="AUTO"
          active={value === 'auto'}
          disabled={disabled}
          onPress={() => onChange('auto')}
        />
        <SquareButton
          variant="on"
          icon="power"
          label="ON"
          active={value === 'on'}
          disabled={disabled}
          onPress={() => onChange('on')}
        />
        <SquareButton
          variant="off"
          icon="stop"
          label="OFF"
          active={value === 'off'}
          disabled={disabled}
          onPress={() => onChange('off')}
        />
      </View>
    </View>
  );
}

function SquareButton({
  variant,
  icon,
  label,
  active,
  onPress,
  disabled,
}: {
  variant: 'auto' | 'on' | 'off';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const activeBg = variant === 'on' ? '#34C759' : variant === 'off' ? '#FF3B30' : '#FFFFFF';
  const activeIconColor = variant === 'auto' ? '#007AFF' : '#FFFFFF';
  const activeBorderColor = variant === 'auto' ? '#007AFF' : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.sqBtn,
        active && {
          backgroundColor: activeBg,
          borderColor: activeBorderColor,
          borderWidth: variant === 'auto' ? 1.5 : 0,
        },
        pressed && !disabled && { opacity: 0.7 },
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={active ? activeIconColor : '#8E8E93'}
      />
      <Text
        style={[
          styles.sqBtnLabel,
          active && { color: variant === 'auto' ? '#007AFF' : '#FFFFFF' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { paddingBottom: 34 },

  title: {
    fontSize: 32, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5,
    paddingHorizontal: 20, paddingTop: 60,
  },
  subtitle: {
    fontSize: 13, color: '#8E8E93', lineHeight: 18,
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 18,
  },

  sectionLabel: {
    fontSize: 16, fontWeight: '600', color: '#1C1C1E',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
  },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14,
  },
  statusBannerTitle: { fontSize: 14, fontWeight: '700' },
  statusBannerHint: { fontSize: 12, color: '#4A4A4A', marginTop: 2, lineHeight: 16 },

  disabled: { opacity: 0.45 },

  // Actuator card
  actuatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  actuatorHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 14,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  actuatorLabel: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  overrideBadge: {
    backgroundColor: '#FF9500', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  overrideBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },

  // Square button row
  btnRow: { flexDirection: 'row', gap: 8 },
  sqBtn: {
    flex: 1,
    aspectRatio: 1.4,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 0,
  },
  sqBtnLabel: {
    fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5,
  },

  // Sleep card
  sleepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  sleepLabel: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  sleepSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  // Reset
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD4D1',
  },
  resetText: { fontSize: 14, fontWeight: '600', color: '#FF3B30' },
});
