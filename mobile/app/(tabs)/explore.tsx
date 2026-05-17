import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeMode, type ThemeMode } from '@/contexts/theme';
import { useAppSettings, DEFAULT_APP_SETTINGS } from '@/contexts/appSettings';
import { walrusAPI, type DeviceCommands, type DeviceConfigKey } from '@/services/api';
import { computeDeviceStatus } from '@/services/deviceStatus';

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  { label: 'Light',  value: 'light',  icon: 'sunny-outline' },
  { label: 'Dark',   value: 'dark',   icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const t = useTheme();
  const { mode, setMode } = useThemeMode();
  const { settings: appSettings, set: setAppSetting, reset: resetAppSettings } = useAppSettings();
  const [commands, setCommands] = useState<DeviceCommands | null>(null);

  useEffect(() => {
    walrusAPI.getDeviceCommands().then((c) => c && setCommands(c));
    const unsub = walrusAPI.subscribeToDeviceCommands((c) => setCommands(c));
    return () => unsub();
  }, []);

  const setConfig = async (key: DeviceConfigKey, value: number) => {
    setCommands((prev) => (prev ? { ...prev, [key]: value } : prev));
    const next = await walrusAPI.setDeviceCommands({ [key]: value });
    if (next) setCommands(next);
  };

  const resetDeviceConfig = () => {
    Alert.alert(
      'Reset device config?',
      'Schedule, cycles, and sync interval go back to defaults. Override states are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaults: Record<DeviceConfigKey, number> = {
              wake_minute: 480,
              sleep_minute: 1020,
              peltier_start_minute: 630,
              peltier_stop_minute: 870,
              peltier_on_minutes: 12,
              peltier_cycle_minutes: 30,
              collect_cycle_minutes: 30,
              collect_duration_seconds: 5,
              sync_interval_ms: 500,
            };
            const next = await walrusAPI.setDeviceCommands(defaults);
            if (next) setCommands(next);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: t.textPrimary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: t.textSecondary }]}>Appearance, device schedule, and detection thresholds</Text>

      {/* ── Appearance ── */}
      <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg }]}>
        <CardHeader icon="contrast" iconBg={t.purpleSoft} iconColor={t.purple}
          title="Theme" subtitle="System matches your device. Light or Dark forces a fixed theme." />
        <PillGroup
          options={THEME_OPTIONS.map((o) => ({ label: o.label, value: o.value, icon: o.icon }))}
          value={mode}
          onChange={(v) => setMode(v as ThemeMode)}
        />
      </View>

      {/* ── Device Schedule ── */}
      <SectionHeader title="Device Schedule" subtitle="Times are local to the device (PST)" />
      <Stepper
        label="Wake time"
        value={commands?.wake_minute ?? 480}
        formatValue={fmtTimeOfDay}
        step={15}
        min={0} max={1439}
        onChange={(v) => setConfig('wake_minute', v)}
      />
      <Stepper
        label="Sleep time"
        value={commands?.sleep_minute ?? 1020}
        formatValue={fmtTimeOfDay}
        step={15}
        min={0} max={1439}
        onChange={(v) => setConfig('sleep_minute', v)}
      />
      <Stepper
        label="Peltier window start"
        value={commands?.peltier_start_minute ?? 630}
        formatValue={fmtTimeOfDay}
        step={15}
        min={0} max={1439}
        onChange={(v) => setConfig('peltier_start_minute', v)}
      />
      <Stepper
        label="Peltier window end"
        value={commands?.peltier_stop_minute ?? 870}
        formatValue={fmtTimeOfDay}
        step={15}
        min={0} max={1439}
        onChange={(v) => setConfig('peltier_stop_minute', v)}
      />

      {/* ── Cycles ── */}
      <SectionHeader title="Cycles" subtitle="Pump and Peltier timing" />
      <Stepper
        label="Peltier ON per cycle"
        value={commands?.peltier_on_minutes ?? 12}
        suffix=" min"
        step={1}
        min={1} max={60}
        onChange={(v) => setConfig('peltier_on_minutes', v)}
      />
      <Stepper
        label="Peltier cycle length"
        value={commands?.peltier_cycle_minutes ?? 30}
        suffix=" min"
        step={5}
        min={5} max={120}
        onChange={(v) => setConfig('peltier_cycle_minutes', v)}
      />
      <Stepper
        label="Collect pump interval"
        value={commands?.collect_cycle_minutes ?? 30}
        suffix=" min"
        step={5}
        min={5} max={240}
        onChange={(v) => setConfig('collect_cycle_minutes', v)}
      />
      <Stepper
        label="Collect pump duration"
        value={commands?.collect_duration_seconds ?? 5}
        suffix=" s"
        step={1}
        min={1} max={120}
        onChange={(v) => setConfig('collect_duration_seconds', v)}
      />
      <Stepper
        label="Sync interval"
        value={commands?.sync_interval_ms ?? 500}
        suffix=" ms"
        step={100}
        min={100} max={5000}
        onChange={(v) => setConfig('sync_interval_ms', v)}
      />

      <Pressable onPress={resetDeviceConfig} style={[styles.resetBtn, { borderColor: t.danger }]}>
        <Ionicons name="refresh" size={14} color={t.danger} />
        <Text style={[styles.resetText, { color: t.danger }]}>Reset device config</Text>
      </Pressable>

      {/* ── Detection (app-only) ── */}
      <SectionHeader title="Detection (app only)" subtitle="How the app interprets data — doesn't affect the device" />
      <Stepper
        label="Offline threshold"
        value={appSettings.offlineThresholdSeconds}
        suffix=" s"
        step={5}
        min={5} max={300}
        onChange={(v) => setAppSetting('offlineThresholdSeconds', v)}
      />

      {/* ── Warnings (app-only) ── */}
      <SectionHeader title="Warnings (app only)" subtitle="Thresholds for the colored status text on Home" />
      <Stepper
        label="TDS — Clean below"
        value={appSettings.tdsCleanMax}
        suffix=" ppm"
        step={25}
        min={50} max={1000}
        onChange={(v) => setAppSetting('tdsCleanMax', v)}
      />
      <Stepper
        label="TDS — Moderate below"
        value={appSettings.tdsModerateMax}
        suffix=" ppm"
        step={25}
        min={100} max={2000}
        onChange={(v) => setAppSetting('tdsModerateMax', v)}
      />
      <Stepper
        label="Basin — Normal below"
        value={appSettings.basinNormalMax}
        suffix=" °C"
        step={1}
        min={20} max={80}
        onChange={(v) => setAppSetting('basinNormalMax', v)}
      />
      <Stepper
        label="Basin — Warm below"
        value={appSettings.basinWarmMax}
        suffix=" °C"
        step={1}
        min={25} max={90}
        onChange={(v) => setAppSetting('basinWarmMax', v)}
      />

      <Pressable
        onPress={() => Alert.alert('Reset app thresholds?', 'Detection + warning sliders go back to defaults.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: resetAppSettings },
        ])}
        style={[styles.resetBtn, { borderColor: t.danger }]}
      >
        <Ionicons name="refresh" size={14} color={t.danger} />
        <Text style={[styles.resetText, { color: t.danger }]}>Reset app thresholds</Text>
      </Pressable>

      {/* ── About ── */}
      <SectionHeader title="About" />
      <View style={[styles.card, { backgroundColor: t.cardBg }]}>
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

// ────────────────────────────────────────────────────────────────
// Reusable pieces
// ────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = useTheme();
  return (
    <>
      <Text style={[styles.sectionLabel, { color: t.textPrimary, marginTop: 18 }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSub, { color: t.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </>
  );
}

function CardHeader({
  icon, iconBg, iconColor, title, subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
}) {
  const t = useTheme();
  return (
    <View style={styles.cardHeader}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: t.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.cardSubtitle, { color: t.textSecondary }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function PillGroup<T extends string>({
  options, value, onChange,
}: {
  options: { label: string; value: T; icon?: keyof typeof Ionicons.glyphMap }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.pillGroup, { backgroundColor: t.pillTrack }]}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.pill, active && { backgroundColor: t.pillThumbActive }]}
          >
            {opt.icon ? (
              <Ionicons
                name={opt.icon}
                size={14}
                color={active ? t.accent : t.textSecondary}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text style={[styles.pillText, { color: active ? t.accent : t.textSecondary }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper({
  label, value, suffix = '', formatValue, step, min, max, onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  formatValue?: (v: number) => string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const t = useTheme();
  const display = formatValue ? formatValue(value) : `${value}${suffix}`;
  const canDec = value > min;
  const canInc = value < max;
  const dec = () => canDec && onChange(Math.max(min, value - step));
  const inc = () => canInc && onChange(Math.min(max, value + step));

  return (
    <View style={[styles.stepperRow, { backgroundColor: t.cardBg }]}>
      <Text style={[styles.stepperLabel, { color: t.textPrimary }]}>{label}</Text>
      <View style={[styles.stepperControls, { backgroundColor: t.pillTrack }]}>
        <Pressable
          onPress={dec}
          disabled={!canDec}
          style={[styles.stepBtn, !canDec && { opacity: 0.3 }]}
        >
          <Ionicons name="remove" size={18} color={t.textPrimary} />
        </Pressable>
        <Text style={[styles.stepperValue, { color: t.textPrimary }]}>{display}</Text>
        <Pressable
          onPress={inc}
          disabled={!canInc}
          style={[styles.stepBtn, !canInc && { opacity: 0.3 }]}
        >
          <Ionicons name="add" size={18} color={t.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: t.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: t.textPrimary }]}>{value}</Text>
    </View>
  );
}

function Divider() {
  const t = useTheme();
  return <View style={[styles.divider, { backgroundColor: t.surfaceMuted }]} />;
}

// Format minute-of-day → "HH:MM"
function fmtTimeOfDay(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 34 },

  title: {
    fontSize: 32, fontWeight: '700', letterSpacing: -0.5,
    paddingHorizontal: 20, paddingTop: 60,
  },
  subtitle: {
    fontSize: 13, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8,
  },

  sectionLabel: {
    fontSize: 16, fontWeight: '600',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4,
  },
  sectionSub: {
    fontSize: 12, paddingHorizontal: 20, paddingBottom: 10,
  },

  card: {
    borderRadius: 16, marginHorizontal: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },

  pillGroup: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  pill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8,
  },
  pillText: { fontSize: 13, fontWeight: '600' },

  // Stepper rows (sit in their own card-like wrapper, stacked tightly)
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 16, marginBottom: 6,
    borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  stepperLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  stepperControls: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 999, paddingHorizontal: 4,
  },
  stepBtn: {
    width: 32, height: 32, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 14, fontWeight: '600',
    minWidth: 72, textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: 16, marginTop: 10,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1,
  },
  resetText: { fontSize: 13, fontWeight: '600' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth },
});
