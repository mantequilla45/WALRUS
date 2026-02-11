import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusBadgeProps {
  status: 'Idle' | 'Refilling' | 'Distilling' | 'Sleep' | 'Fault';
}

const CONFIG: Record<StatusBadgeProps['status'], {
  color: string;
  bg: string;
  border: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  Idle: {
    color: '#94a3b8',
    bg: '#1e293b',
    border: '#334155',
    icon: 'pause-circle',
  },
  Refilling: {
    color: '#38bdf8',
    bg: '#0c1e36',
    border: '#1e3a5f',
    icon: 'water',
  },
  Distilling: {
    color: '#34d399',
    bg: '#0a1f1a',
    border: '#14533d',
    icon: 'flame',
  },
  Sleep: {
    color: '#a78bfa',
    bg: '#1a0f2e',
    border: '#3b2068',
    icon: 'moon',
  },
  Fault: {
    color: '#f87171',
    bg: '#2a0f0f',
    border: '#7f1d1d',
    icon: 'alert-circle',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { color, bg, border, icon } = CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={15} color={color} style={styles.icon} />
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});