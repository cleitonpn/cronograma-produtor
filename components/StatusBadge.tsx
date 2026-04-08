import { STATUS_COLORS } from '@/lib/theme';
import {
  EVENT_STATUS_LABELS,
  EventStatus,
  PROJECT_STATUS_LABELS,
  ProjectStatus,
  TASK_STATUS_LABELS,
  TaskStatus,
} from '@/lib/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type BadgeType = 'task' | 'project' | 'event';

interface Props {
  status: TaskStatus | ProjectStatus | EventStatus;
  type: BadgeType;
  small?: boolean;
}

function getLabel(status: string, type: BadgeType): string {
  if (type === 'task') return TASK_STATUS_LABELS[status as TaskStatus] ?? status;
  if (type === 'project') return PROJECT_STATUS_LABELS[status as ProjectStatus] ?? status;
  return EVENT_STATUS_LABELS[status as EventStatus] ?? status;
}

function getColors(status: string, type: BadgeType) {
  const map = STATUS_COLORS[type] as Record<string, { bg: string; text: string; border: string }>;
  return map[status] ?? { bg: '#ECEFF1', text: '#37474F', border: '#B0BEC5' };
}

export default function StatusBadge({ status, type, small = false }: Props) {
  const { bg, text, border } = getColors(status, type);
  const label = getLabel(status, type);

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }, small && styles.small]}>
      <Text style={[styles.text, { color: text }, small && styles.smallText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
});
