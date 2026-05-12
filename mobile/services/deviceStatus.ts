/**
 * Device status computation
 *
 * Combines connectivity (recency of last reading + sleep flag) with the
 * operational state the ESP32 reports, into a single user-facing status.
 */

import type { SensorReading, DeviceCommands } from './api';

export type StatusKind = 'active' | 'idle' | 'sleeping' | 'fault' | 'offline' | 'unknown';

export interface DeviceStatus {
  kind: StatusKind;
  label: string;        // "Active", "Sleeping", "Offline", ...
  detail?: string;      // "Distilling", "Last seen 4m ago", ...
  color: string;        // foreground hex
  bgColor: string;      // soft background hex
  iconName: string;     // Ionicons name to render
  canOverride: boolean; // false = override won't apply meaningfully
}

const OFFLINE_THRESHOLD_MS = 30 * 1000;
const ACTIVE_STATES = ['Distilling', 'Collecting', 'Refilling'];

export function computeDeviceStatus(
  reading: SensorReading | null,
  commands: DeviceCommands | null,
  now: number = Date.now()
): DeviceStatus {
  // Never connected
  if (!reading) {
    return {
      kind: 'unknown',
      label: 'Unknown',
      detail: 'No data yet',
      color: '#8E8E93',
      bgColor: '#F2F2F7',
      iconName: 'help-circle',
      canOverride: true,
    };
  }

  // Sleep flag is authoritative — regardless of when last reading came in.
  if (commands?.sleep) {
    return {
      kind: 'sleeping',
      label: 'Sleeping',
      detail: 'Wakes on schedule',
      color: '#5856D6',
      bgColor: '#F0F4FF',
      iconName: 'moon',
      canOverride: true,    // queues until wake
    };
  }

  // Offline check — last reading older than threshold
  const ageMs = now - new Date(reading.created_at).getTime();
  if (ageMs > OFFLINE_THRESHOLD_MS) {
    return {
      kind: 'offline',
      label: 'Offline',
      detail: `Last seen ${humanizeAge(ageMs)}`,
      color: '#FF3B30',
      bgColor: '#FFEBEB',
      iconName: 'cloud-offline',
      canOverride: false,   // controls locked while offline
    };
  }

  // Online — branch on what the ESP32 reports
  const state = reading.state ?? 'Idle';

  if (state === 'Fault') {
    return {
      kind: 'fault',
      label: 'Fault',
      detail: 'Device reports an error',
      color: '#FF9500',
      bgColor: '#FFF3E0',
      iconName: 'warning',
      canOverride: true,
    };
  }

  if (ACTIVE_STATES.includes(state)) {
    return {
      kind: 'active',
      label: 'Active',
      detail: state,
      color: '#34C759',
      bgColor: '#E8F8ED',
      iconName: 'flash',
      canOverride: true,
    };
  }

  // Idle / Monitoring / anything else online
  return {
    kind: 'idle',
    label: state || 'Idle',
    detail: 'Online',
    color: '#007AFF',
    bgColor: '#EBF5FF',
    iconName: 'pulse',
    canOverride: true,
  };
}

function humanizeAge(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}
