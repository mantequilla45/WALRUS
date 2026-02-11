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

export function SensorCard({ label, value, unit, icon, status = 'normal', compact = false }: SensorCardProps) {
  const isAlert = status !== 'normal';
  const alertColor = status === 'critical' ? '#FF3B30' : '#FF9F0A';

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.label}>{label}</Text>
        {isAlert && <View style={[styles.alertDot, { backgroundColor: alertColor }]} />}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompact: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    flex: 1,
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  valueCompact: {
    fontSize: 24,
  },
  unit: {
    fontSize: 14,
    color: '#AEAEB2',
    fontWeight: '500',
  },
});