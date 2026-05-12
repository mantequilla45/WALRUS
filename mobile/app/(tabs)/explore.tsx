import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeMode, type ThemeMode } from '@/contexts/theme';

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  { label: 'Light',  value: 'light',  icon: 'sunny-outline' },
  { label: 'Dark',   value: 'dark',   icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const t = useTheme();
  const { mode, setMode } = useThemeMode();

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: t.textPrimary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: t.textSecondary }]}>App preferences and device info</Text>

      {/* ── Appearance ── */}
      <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: t.purpleSoft }]}>
            <Ionicons name="contrast" size={16} color={t.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Theme</Text>
            <Text style={[styles.cardSubtitle, { color: t.textSecondary }]}>
              System matches your device. Light or Dark forces a fixed theme.
            </Text>
          </View>
        </View>

        <View style={[styles.pillGroup, { backgroundColor: t.pillTrack }]}>
          {THEME_OPTIONS.map((opt) => {
            const active = mode === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setMode(opt.value)}
                style={[styles.pill, active && { backgroundColor: t.pillThumbActive }]}
              >
                <Ionicons
                  name={opt.icon}
                  size={14}
                  color={active ? t.accent : t.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.pillText, { color: active ? t.accent : t.textSecondary }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── About ── */}
      <Text style={[styles.sectionLabel, { color: t.textPrimary }]}>About</Text>
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
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
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

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth },
});
