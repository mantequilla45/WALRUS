import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusBadgeProps {
  status: string;
  connected?: boolean;
}

const CONFIG: Record<string, {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  Idle:       { color: '#8E8E93', icon: 'pause-circle' },
  Monitoring: { color: '#5AC8FA', icon: 'eye' },
  Refilling:  { color: '#007AFF', icon: 'water' },
  Filling:    { color: '#007AFF', icon: 'water' },          // pre-Peltier basin fill
  Heating:    { color: '#FF9500', icon: 'flame' },          // Peltier active
  Distilling: { color: '#34C759', icon: 'flame' },
  Collecting: { color: '#34C759', icon: 'archive' },
  Sleep:      { color: '#5856D6', icon: 'moon' },
  Sleeping:   { color: '#5856D6', icon: 'moon' },           // firmware-reported sleep
  Fault:      { color: '#FF3B30', icon: 'alert-circle' },
};

export function StatusBadge({ status, connected = false }: StatusBadgeProps) {
  const { color, icon } = CONFIG[status] || CONFIG.Idle;

  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});