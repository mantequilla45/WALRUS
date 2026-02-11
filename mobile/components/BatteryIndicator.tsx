import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BatteryIndicatorProps {
  voltage: number;
  isCharging?: boolean;
}

export function BatteryIndicator({ voltage, isCharging = false }: BatteryIndicatorProps) {
  const percentage = Math.min(100, Math.max(0, ((voltage - 11) / 1.6) * 100));

  const getColor = () => {
    if (percentage > 60) return '#34d399';
    if (percentage > 30) return '#fbbf24';
    return '#f87171';
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isCharging) return 'flash';
    if (percentage > 75) return 'battery-full';
    if (percentage > 50) return 'battery-half';
    return 'battery-dead';
  };

  const color = getColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: color + '18' }]}>
          <Ionicons name={getIcon()} size={18} color={color} />
        </View>
        <Text style={styles.label}>Battery</Text>
        {isCharging && (
          <View style={styles.chargingBadge}>
            <Ionicons name="flash" size={11} color="#fbbf24" />
            <Text style={styles.chargingText}>Charging</Text>
          </View>
        )}
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.barTip} />
      </View>

      <View style={styles.info}>
        <Text style={styles.voltage}>{voltage.toFixed(2)}V</Text>
        <Text style={[styles.percentage, { color }]}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111a2b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a2540',
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
  chargingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chargingText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '600',
    marginLeft: 3,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: '#1a2540',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barTip: {
    width: 4,
    height: 10,
    backgroundColor: '#1a2540',
    marginLeft: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  voltage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    fontVariant: ['tabular-nums'],
  },
  percentage: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});