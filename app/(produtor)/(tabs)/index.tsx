import EmptyState from '@/components/EmptyState';
import ProjectCard from '@/components/ProjectCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { Project } from '@/lib/types';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeusProjetos() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        event:events(id, name, start_date, end_date, client, location)
      `)
      .eq('producer_id', profile.id)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    const ids = data.map((p: any) => p.id);
    const [totalRes, doneRes] = await Promise.all([
      ids.length > 0 ? supabase.from('project_tasks').select('project_id').in('project_id', ids) : Promise.resolve({ data: [] }),
      ids.length > 0 ? supabase.from('project_tasks').select('project_id').in('project_id', ids).eq('status', 'concluido') : Promise.resolve({ data: [] }),
    ]);

    const totalMap: Record<string, number> = {};
    const doneMap: Record<string, number> = {};
    (totalRes.data ?? []).forEach((t: any) => { totalMap[t.project_id] = (totalMap[t.project_id] || 0) + 1; });
    (doneRes.data ?? []).forEach((t: any) => { doneMap[t.project_id] = (doneMap[t.project_id] || 0) + 1; });

    setProjects(data.map((p: any) => ({
      ...p,
      total_tasks: totalMap[p.id] ?? 0,
      done_tasks: doneMap[p.id] ?? 0,
    })));
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const inProgress = projects.filter((p) => p.status === 'em_andamento');
  const pending = projects.filter((p) => p.status === 'pendente');
  const done = projects.filter((p) => p.status === 'concluido');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectCard project={item} adminView={false} />}
          contentContainerStyle={[styles.list, projects.length === 0 && styles.emptyList]}
          ListHeaderComponent={
            projects.length > 0 ? (
              <View style={styles.summaryRow}>
                <SummaryChip label="Em Andamento" value={inProgress.length} color={COLORS.primary} />
                <SummaryChip label="Pendentes" value={pending.length} color={COLORS.secondary} />
                <SummaryChip label="Concluídos" value={done.length} color={COLORS.success} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="construct-outline"
              title="Nenhum projeto atribuído"
              subtitle="O administrador ainda não criou projetos para você"
            />
          }
          onRefresh={load}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color + '50' }]}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 14, paddingBottom: 40 },
  emptyList: { flex: 1 },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  chipValue: { fontSize: 22, fontWeight: '800' },
  chipLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
});
