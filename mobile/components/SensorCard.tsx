import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SensorCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  status?: 'normal' | 'warning' | 'critical';
  compact?: boolean;
}

const STATUS = {
  normal: { accent: '#34d399', glow: 'rgba(52, 211, 153, 0.12)' },
  warning: { accent: '#fbbf24', glow: 'rgba(251, 191, 36, 0.12)' },
  critical: { accent: '#f87171', glow: 'rgba(248, 113, 113, 0.12)' },
};

export function SensorCard({ label, value, unit, icon, status = 'normal', compact = false }: SensorCardProps) {
  const { accent, glow } = STATUS[status];

  return (
    <View style={[styles.card, { borderLeftColor: accent }, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: glow }]}>
          {icon}
        </View>
        <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: accent }]} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
        <Text style={[styles.unit, compact && styles.unitCompact]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111a2b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  cardCompact: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: {
    fontSize: 13,
    color: '#8494a7',
    fontWeight: '500',
    flex: 1,
  },
  labelCompact: {
    fontSize: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingLeft: 2,
  },
  value: {
    fontSize: 30,
    fontWeight: '700',
    color: '#e2e8f0',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  valueCompact: {
    fontSize: 24,
  },
  unit: {
    fontSize: 14,
    color: '#536178',
    marginLeft: 6,
    fontWeight: '600',
  },
  unitCompact: {
    fontSize: 12,
  },
});