import EmptyState from '@/components/EmptyState';
import ProjectCard from '@/components/ProjectCard';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { Project } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjetosTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        event:events(id, name, start_date, end_date),
        producer:profiles!projects_producer_id_fkey(id, name),
        total_tasks:project_tasks(count),
        done_tasks:project_tasks(count)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const parsed = data.map((p: any) => ({
        ...p,
        total_tasks: p.total_tasks?.[0]?.count ?? 0,
        done_tasks: p.done_tasks
          ? p.done_tasks.filter ? p.done_tasks.length : (p.done_tasks?.[0]?.count ?? 0)
          : 0,
      }));
      // For done_tasks we need a separate query since we can't filter in count easily
      setProjects(parsed);
    }
    setLoading(false);
  }, []);

  const loadWithProgress = useCallback(async () => {
    setLoading(true);
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        *,
        event:events(id, name, start_date, end_date),
        producer:profiles!projects_producer_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false });

    if (!projects) { setLoading(false); return; }

    const ids = projects.map((p: any) => p.id);
    const [totalRes, doneRes] = await Promise.all([
      supabase.from('project_tasks').select('project_id').in('project_id', ids),
      supabase.from('project_tasks').select('project_id').in('project_id', ids).eq('status', 'concluido'),
    ]);

    const totalMap: Record<string, number> = {};
    const doneMap: Record<string, number> = {};
    (totalRes.data ?? []).forEach((t: any) => { totalMap[t.project_id] = (totalMap[t.project_id] || 0) + 1; });
    (doneRes.data ?? []).forEach((t: any) => { doneMap[t.project_id] = (doneMap[t.project_id] || 0) + 1; });

    setProjects(projects.map((p: any) => ({
      ...p,
      total_tasks: totalMap[p.id] ?? 0,
      done_tasks: doneMap[p.id] ?? 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { loadWithProgress(); }, [loadWithProgress]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.event?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.producer?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={COLORS.grey} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar projetos..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.greyMed}
        />
        {search.length > 0 && (
          <Ionicons name="close-circle" size={16} color={COLORS.grey} onPress={() => setSearch('')} />
        )}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectCard project={item} adminView />}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.emptyList]}
          ListEmptyComponent={
            <EmptyState
              icon="construct-outline"
              title="Nenhum projeto encontrado"
              subtitle="Toque no + para criar o primeiro projeto"
            />
          }
          onRefresh={loadWithProgress}
          refreshing={loading}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/admin/projeto/novo' as any)}
        color={COLORS.white}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  list: { padding: 14, paddingBottom: 80 },
  emptyList: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: COLORS.primary,
  },
});
