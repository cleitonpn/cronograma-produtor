import { formatDate, progressPercent } from '@/lib/format';
import { COLORS } from '@/lib/theme';
import { Project } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import StatusBadge from './StatusBadge';

interface Props {
  project: Project;
  adminView?: boolean;
}

export default function ProjectCard({ project, adminView = false }: Props) {
  const done = project.done_tasks ?? 0;
  const total = project.total_tasks ?? 0;
  const pct = progressPercent(done, total);
  const path = adminView
    ? `/admin/projeto/${project.id}`
    : `/produtor/projeto/${project.id}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(path as any)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="construct-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.name} numberOfLines={1}>{project.name}</Text>
        </View>
        <StatusBadge status={project.status} type="project" small />
      </View>

      {project.event && (
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.grey} />
          <Text style={styles.meta}>{project.event.name}</Text>
        </View>
      )}

      {adminView && project.producer && (
        <View style={styles.row}>
          <Ionicons name="person-outline" size={13} color={COLORS.grey} />
          <Text style={styles.meta}>{project.producer.name}</Text>
        </View>
      )}

      {project.event?.start_date && (
        <View style={styles.row}>
          <Ionicons name="time-outline" size={13} color={COLORS.grey} />
          <Text style={styles.meta}>
            {formatDate(project.event.start_date)} → {formatDate(project.event.end_date)}
          </Text>
        </View>
      )}

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {done}/{total} tarefas
          </Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <ProgressBar
          progress={pct / 100}
          color={pct === 100 ? COLORS.success : COLORS.primary}
          style={styles.bar}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 4,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressSection: {
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.greyMed,
  },
});
