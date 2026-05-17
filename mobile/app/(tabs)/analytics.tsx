import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { walrusAPI, type SensorReading } from '@/services/api';
import { useTheme, type Theme } from '@/contexts/theme';

type Range = '24h' | '7d' | '30d';
const RANGES: Range[] = ['24h', '7d', '30d'];

type FocusKey = 'tds' | 'basin_temp' | 'activations';

const screenW = Dimensions.get('window').width;
const chartW = screenW - 32; // 16px margin each side

function buildChartConfig(t: Theme, accentRgb: string) {
  const labelRgb = t.isDark ? '235, 235, 245' : '60, 60, 67';
  const bg = t.cardBg;
  return {
    paddingRight: 24,
    backgroundGradientFrom: bg,
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: bg,
    backgroundGradientToOpacity: 1,
    color:       (opacity = 1) => `rgba(${accentRgb}, ${opacity})`,
    labelColor:  (opacity = 1) => `rgba(${labelRgb}, ${opacity * 0.6})`,
    propsForDots: { r: '0' },
    propsForBackgroundLines: { stroke: t.surfaceMuted },
    strokeWidth: 2,
    decimalPlaces: 1,
  };
}

export default function AnalyticsScreen() {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const params = useLocalSearchParams<{ focus?: FocusKey }>();
  const [range, setRange] = useState<Range>('24h');
  const [rows, setRows] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert hex theme tokens to rgb tuples for chart-kit (which wants `rgba(...)` strings)
  const accentRgb  = t.isDark ? '10, 132, 255'  : '0, 122, 255';
  const warningRgb = t.isDark ? '255, 159, 10'  : '255, 149, 0';
  const purpleRgb  = t.isDark ? '94, 92, 230'   : '88, 86, 214';
  const successRgb = t.isDark ? '48, 209, 88'   : '52, 199, 89';

  const lineConfig = useMemo(() => buildChartConfig(t, accentRgb), [t, accentRgb]);
  const tempConfig = useMemo(() => ({ ...buildChartConfig(t, warningRgb) }), [t, warningRgb]);
  const tdsConfig  = useMemo(() => ({ ...buildChartConfig(t, purpleRgb), decimalPlaces: 0 }), [t, purpleRgb]);
  const barConfig  = useMemo(() => ({ ...buildChartConfig(t, successRgb), decimalPlaces: 0, barPercentage: 0.7 }), [t, successRgb]);

  const scrollRef = useRef<ScrollView>(null);
  const chartYs = useRef<Partial<Record<FocusKey, number>>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    walrusAPI.getHistory(range).then((res) => {
      if (cancelled) return;
      setRows(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [range]);

  // Scroll to focused chart every time the tab gains focus (handles repeat taps)
  useFocusEffect(
    useCallback(() => {
      if (!params.focus) return;
      const t = setTimeout(() => {
        const y = chartYs.current[params.focus as FocusKey];
        if (typeof y === 'number') {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
        }
      }, 400); // let charts finish laying out
      return () => clearTimeout(t);
    }, [params.focus, loading])
  );

  const metrics = useMemo(() => computeMetrics(rows), [rows]);
  const tempSeries  = useMemo(() => downsample(rows, 'basin_temp', range), [rows, range]);
  const tdsSeries   = useMemo(() => downsample(rows, 'tds_ppm', range), [rows, range]);
  const activations = useMemo(() => activationsByBucket(rows, range), [rows, range]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      bounces
      alwaysBounceVertical
      overScrollMode="always"
      decelerationRate="normal"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>System usage over time</Text>

      <View style={styles.rangeGroup}>
        {RANGES.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={[styles.rangePill, range === r && styles.rangePillActive]}
          >
            <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : rows.length < 2 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="analytics-outline" size={32} color={t.chevron} />
          <Text style={styles.emptyText}>Not enough data yet</Text>
          <Text style={styles.emptySub}>Once the device has been running, charts will appear here.</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <SummaryCard
              icon="power"
              iconBg={t.accentSoft}
              iconColor={t.accent}
              label="Operating Time"
              value={formatMinutes(metrics.operatingMs)}
              hint={`Sleep ${formatMinutes(metrics.sleepingMs)}`}
            />
            <SummaryCard
              icon="repeat"
              iconBg={t.successSoft}
              iconColor={t.success}
              label="Pump Cycles"
              value={`${metrics.intakeCycles + metrics.collectCycles}`}
              hint={`${metrics.intakeCycles} in · ${metrics.collectCycles} out`}
            />
          </View>
          <View style={styles.summaryRow}>
            <SummaryCard
              icon="flame-outline"
              iconBg={t.purpleSoft}
              iconColor={t.purple}
              label="Peltier Runtime"
              value={formatMinutes(metrics.peltierRuntimeMs)}
              hint={`${metrics.peltierCycles} starts`}
            />
            <SummaryCard
              icon="flame"
              iconBg={t.warningSoft}
              iconColor={t.warning}
              label="Peak Basin"
              value={`${metrics.peakBasin.toFixed(1)}°`}
              hint={`Avg ${metrics.avgBasin.toFixed(1)}°`}
            />
          </View>
          <View style={styles.summaryRow}>
            <SummaryCard
              icon="sparkles"
              iconBg={t.accentSoft}
              iconColor={t.accent}
              label="Avg Purity"
              value={`${Math.round(metrics.avgTds)} ppm`}
              hint={`Range ${Math.round(metrics.minTds)}–${Math.round(metrics.maxTds)}`}
            />
            <SummaryCard
              icon="time"
              iconBg={t.surfaceMuted}
              iconColor={t.textSecondary}
              label="Samples"
              value={`${rows.length}`}
              hint={`${range} window`}
            />
          </View>

          {tempSeries.data.length > 1 && (
            <ChartCard
              title="Basin Temperature"
              subtitle="°C over time"
              focused={params.focus === 'basin_temp'}
              onLayoutY={(y) => { chartYs.current.basin_temp = y; }}
            >
              <LineChart
                data={{ labels: tempSeries.labels, datasets: [{ data: tempSeries.data }] }}
                width={chartW}
                height={180}
                chartConfig={tempConfig}
                bezier
                withInnerLines
                withOuterLines={false}
                verticalLabelRotation={range === '30d' ? 30 : 0}
                xLabelsOffset={range === '30d' ? -6 : 0}
                style={styles.chart}
              />
            </ChartCard>
          )}

          {tdsSeries.data.length > 1 && (
            <ChartCard
              title="Water Purity (TDS)"
              subtitle="ppm over time — lower is cleaner"
              focused={params.focus === 'tds'}
              onLayoutY={(y) => { chartYs.current.tds = y; }}
            >
              <LineChart
                data={{ labels: tdsSeries.labels, datasets: [{ data: tdsSeries.data }] }}
                width={chartW}
                height={180}
                chartConfig={tdsConfig}
                bezier
                withInnerLines
                withOuterLines={false}
                verticalLabelRotation={range === '30d' ? 30 : 0}
                xLabelsOffset={range === '30d' ? -6 : 0}
                style={styles.chart}
              />
            </ChartCard>
          )}

          {activations.data.length > 0 && (
            <ChartCard
              title="Pump Activations"
              subtitle={range === '24h' ? 'by hour' : 'by day'}
              focused={params.focus === 'activations'}
              onLayoutY={(y) => { chartYs.current.activations = y; }}
            >
              <BarChart
                data={{ labels: activations.labels, datasets: [{ data: activations.data }] }}
                width={chartW}
                height={180}
                chartConfig={barConfig}
                fromZero
                withInnerLines
                showValuesOnTopOfBars={false}
                verticalLabelRotation={range === '30d' ? 30 : 0}
                xLabelsOffset={range === '30d' ? -6 : 0}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </ChartCard>
          )}
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────────
// Compute helpers
// ──────────────────────────────────────────────────────────────────

interface Metrics {
  intakeCycles: number;
  collectCycles: number;
  peltierCycles: number;
  intakeRuntimeMs: number;
  collectRuntimeMs: number;
  peltierRuntimeMs: number;
  operatingMs: number;   // time NOT in Sleeping state
  sleepingMs: number;    // time in Sleeping state
  peakBasin: number;
  avgBasin: number;
  minTds: number;
  maxTds: number;
  avgTds: number;
}

function computeMetrics(rows: SensorReading[]): Metrics {
  const empty: Metrics = {
    intakeCycles: 0, collectCycles: 0, peltierCycles: 0,
    intakeRuntimeMs: 0, collectRuntimeMs: 0, peltierRuntimeMs: 0,
    operatingMs: 0, sleepingMs: 0,
    peakBasin: 0, avgBasin: 0, minTds: 0, maxTds: 0, avgTds: 0,
  };
  if (rows.length === 0) return empty;

  let intakeCycles = 0, collectCycles = 0, peltierCycles = 0;
  let intakeRuntimeMs = 0, collectRuntimeMs = 0, peltierRuntimeMs = 0;
  let operatingMs = 0, sleepingMs = 0;
  let peakBasin = -Infinity;
  let basinSum = 0, basinN = 0;
  let minTds = Infinity, maxTds = -Infinity;
  let tdsSum = 0, tdsN = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prev = i > 0 ? rows[i - 1] : null;

    if (r.basin_temp !== null) {
      if (r.basin_temp > peakBasin) peakBasin = r.basin_temp;
      basinSum += r.basin_temp;
      basinN++;
    }
    if (r.tds_ppm !== null) {
      if (r.tds_ppm < minTds) minTds = r.tds_ppm;
      if (r.tds_ppm > maxTds) maxTds = r.tds_ppm;
      tdsSum += r.tds_ppm;
      tdsN++;
    }

    if (prev) {
      const dt = new Date(r.created_at).getTime() - new Date(prev.created_at).getTime();

      if (!prev.intake_pump_active && r.intake_pump_active) intakeCycles++;
      if (!prev.collect_pump_active && r.collect_pump_active) collectCycles++;
      if (!prev.peltier_active && r.peltier_active) peltierCycles++;

      if (r.intake_pump_active) intakeRuntimeMs += dt;
      if (r.collect_pump_active) collectRuntimeMs += dt;
      if (r.peltier_active) peltierRuntimeMs += dt;

      if (r.state === 'Sleeping') sleepingMs += dt;
      else operatingMs += dt;
    }
  }

  return {
    intakeCycles, collectCycles, peltierCycles,
    intakeRuntimeMs, collectRuntimeMs, peltierRuntimeMs,
    operatingMs, sleepingMs,
    peakBasin: peakBasin === -Infinity ? 0 : peakBasin,
    avgBasin: basinN ? basinSum / basinN : 0,
    minTds: minTds === Infinity ? 0 : minTds,
    maxTds: maxTds === -Infinity ? 0 : maxTds,
    avgTds: tdsN ? tdsSum / tdsN : 0,
  };
}

function downsample(
  rows: SensorReading[],
  key: keyof Pick<SensorReading, 'basin_temp' | 'tds_ppm'>,
  range: Range
): { labels: string[]; data: number[] } {
  if (rows.length === 0) return { labels: [], data: [] };

  // Bucket by actual time (hour for 24h, day for 7d/30d) so labels never duplicate.
  const bucketMs = range === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  type Bucket = { sum: number; count: number; ts: number };
  const buckets = new Map<number, Bucket>();

  for (const r of rows) {
    const v = r[key];
    if (v === null) continue;
    const ts = new Date(r.created_at).getTime();
    const idx = Math.floor(ts / bucketMs);
    const existing = buckets.get(idx);
    if (existing) {
      existing.sum += v;
      existing.count++;
    } else {
      buckets.set(idx, { sum: v, count: 1, ts: idx * bucketMs });
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => a.ts - b.ts);
  const out = {
    labels: sorted.map((b) => formatLabel(new Date(b.ts).toISOString(), range)),
    data:   sorted.map((b) => Number((b.sum / b.count).toFixed(1))),
  };

  return sparsifyLabels(out, range === '30d' ? 7 : range === '24h' ? 6 : 7);
}

function activationsByBucket(rows: SensorReading[], range: Range): { labels: string[]; data: number[] } {
  if (rows.length < 2) return { labels: [], data: [] };

  const buckets = new Map<string, number>();
  const bucketKey = (ts: string) => {
    const d = new Date(ts);
    if (range === '24h') return `${d.getHours()}`.padStart(2, '0');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const seen: string[] = [];
  for (const r of rows) {
    const k = bucketKey(r.created_at);
    if (!buckets.has(k)) { buckets.set(k, 0); seen.push(k); }
  }

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1], cur = rows[i];
    const k = bucketKey(cur.created_at);
    let activations = 0;
    if (!prev.intake_pump_active  && cur.intake_pump_active)  activations++;
    if (!prev.collect_pump_active && cur.collect_pump_active) activations++;
    if (activations) buckets.set(k, (buckets.get(k) || 0) + activations);
  }

  const out = { labels: seen, data: seen.map(k => buckets.get(k) || 0) };
  return sparsifyLabels(out, range === '30d' ? 7 : range === '24h' ? 6 : 7);
}

function sparsifyLabels(
  series: { labels: string[]; data: number[] },
  maxLabels: number,
): { labels: string[]; data: number[] } {
  if (series.labels.length <= maxLabels) return series;
  const step = Math.ceil(series.labels.length / maxLabels);
  // Anchor on the LAST point so the most-recent label always shows
  const lastIdx = series.labels.length - 1;
  const labels = series.labels.map((l, i) =>
    (lastIdx - i) % step === 0 ? l : ''
  );
  return { labels, data: series.data };
}

function formatLabel(iso: string, range: Range): string {
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  if (range === '24h') return `${pad(d.getHours())}h`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatMinutes(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

// ──────────────────────────────────────────────────────────────────
// UI subcomponents
// ──────────────────────────────────────────────────────────────────

function SummaryCard({
  icon, iconBg, iconColor, label, value, hint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  hint?: string;
}) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      {hint ? <Text style={styles.summaryHint}>{hint}</Text> : null}
    </View>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  focused,
  onLayoutY,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  focused?: boolean;
  onLayoutY?: (y: number) => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  return (
    <View
      onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}
      style={[styles.chartCard, focused && styles.chartCardFocused]}
    >
      <Text style={styles.chartTitle}>{title}</Text>
      {subtitle ? <Text style={styles.chartSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 34 },

    title: {
      fontSize: 32, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5,
      paddingHorizontal: 20, paddingTop: 60,
    },
    subtitle: {
      fontSize: 13, color: t.textSecondary,
      paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16,
    },

    rangeGroup: {
      flexDirection: 'row',
      backgroundColor: t.pillTrack,
      borderRadius: 999, padding: 3,
      marginHorizontal: 16, marginBottom: 16,
      alignSelf: 'flex-start',
    },
    rangePill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999 },
    rangePillActive: {
      backgroundColor: t.pillThumbActive,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: t.isDark ? 0.3 : 0.06, shadowRadius: 2, elevation: 1,
    },
    rangeText: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    rangeTextActive: { color: t.textPrimary },

    loadingBox: { paddingVertical: 60, alignItems: 'center' },

    emptyBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyText: { fontSize: 15, fontWeight: '600', color: t.textPrimary, marginTop: 12 },
    emptySub: { fontSize: 13, color: t.textSecondary, textAlign: 'center', marginTop: 6 },

    summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
    summaryCard: {
      flex: 1, backgroundColor: t.cardBg, borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.2 : 0.04, shadowRadius: 12, elevation: 2,
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    summaryIcon: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    summaryLabel: { fontSize: 13, fontWeight: '500', color: t.textSecondary, flex: 1 },
    summaryValue: {
      fontSize: 22, fontWeight: '700', color: t.textPrimary,
      fontVariant: ['tabular-nums'], letterSpacing: -0.5, marginBottom: 2,
    },
    summaryHint: { fontSize: 11, fontWeight: '500', color: t.textTertiary },

    chartCard: {
      backgroundColor: t.cardBg, borderRadius: 16,
      marginHorizontal: 16, marginTop: 12, paddingTop: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.2 : 0.04, shadowRadius: 12, elevation: 2,
      overflow: 'hidden',
    },
    chartCardFocused: {
      borderWidth: 2,
      borderColor: t.accent,
    },
    chartTitle: { fontSize: 15, fontWeight: '600', color: t.textPrimary, paddingHorizontal: 16 },
    chartSubtitle: { fontSize: 12, color: t.textSecondary, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
    chart: { marginLeft: -16, marginRight: 0 },
  });
}
