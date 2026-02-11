import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BatteryIndicatorProps {
  voltage: number;
  isCharging?: boolean;
}

export function BatteryIndicator({ voltage, isCharging = false }: BatteryIndicatorProps) {
  const percentage = Math.min(100, Math.max(0, ((voltage - 11) / 1.6) * 100));

  const getColor = () => {
    if (percentage > 60) return '#34C759';
    if (percentage > 30) return '#FF9F0A';
    return '#FF3B30';
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isCharging) return 'flash';
    if (percentage > 75) return 'battery-full';
    if (percentage > 50) return 'battery-half';
    return 'battery-dead';
  };

  const color = getColor();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={getIcon()} size={18} color={color} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.label}>Battery</Text>
          {isCharging && (
            <View style={styles.chargingPill}>
              <Ionicons name="flash" size={10} color="#FF9F0A" />
              <Text style={styles.chargingText}>Charging</Text>
            </View>
          )}
        </View>
        <Text style={[styles.percentage, { color }]}>{Math.round(percentage)}%</Text>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.voltageRow}>
        <Text style={styles.voltageLabel}>Voltage</Text>
        <Text style={styles.voltageValue}>{voltage.toFixed(2)}V</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chargingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  chargingText: {
    fontSize: 10,
    color: '#FF9F0A',
    fontWeight: '600',
  },
  percentage: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  voltageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voltageLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  voltageValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    fontVariant: ['tabular-nums'],
  },
});