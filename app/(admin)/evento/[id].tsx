import EmptyState from '@/components/EmptyState';
import ProjectCard from '@/components/ProjectCard';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { Event, Project } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [event, setEvent] = useState<Event | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [evRes, prRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('projects').select(`
        *,
        producer:profiles!projects_producer_id_fkey(id, name)
      `).eq('event_id', id).order('created_at', { ascending: false }),
    ]);

    if (evRes.data) {
      setEvent(evRes.data);
      navigation.setOptions({ title: evRes.data.name });
    }

    if (prRes.data) {
      const ids = prRes.data.map((p: any) => p.id);
      if (ids.length > 0) {
        const [totalRes, doneRes] = await Promise.all([
          supabase.from('project_tasks').select('project_id').in('project_id', ids),
          supabase.from('project_tasks').select('project_id').in('project_id', ids).eq('status', 'concluido'),
        ]);
        const totalMap: Record<string, number> = {};
        const doneMap: Record<string, number> = {};
        (totalRes.data ?? []).forEach((t: any) => { totalMap[t.project_id] = (totalMap[t.project_id] || 0) + 1; });
        (doneRes.data ?? []).forEach((t: any) => { doneMap[t.project_id] = (doneMap[t.project_id] || 0) + 1; });
        setProjects(prRes.data.map((p: any) => ({
          ...p,
          event: event,
          total_tasks: totalMap[p.id] ?? 0,
          done_tasks: doneMap[p.id] ?? 0,
        })));
      } else {
        setProjects([]);
      }
    }
    setLoading(false);
  }, [id, navigation]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = () => {
    Alert.alert('Excluir Evento', 'Tem certeza? Todos os projetos do evento serão removidos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await supabase.from('events').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {event && (
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <StatusBadge status={event.status} type="event" />
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerInfo}>
            {event.client && (
              <View style={styles.row}>
                <Ionicons name="business-outline" size={13} color={COLORS.grey} />
                <Text style={styles.meta}>{event.client}</Text>
              </View>
            )}
            {event.location && (
              <View style={styles.row}>
                <Ionicons name="location-outline" size={13} color={COLORS.grey} />
                <Text style={styles.meta}>{event.location}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.grey} />
              <Text style={styles.meta}>
                {formatDate(event.start_date)} → {formatDate(event.end_date)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.projectsTitle}>Projetos ({projects.length})</Text>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProjectCard project={{ ...item, event: event ?? undefined }} adminView />}
        contentContainerStyle={[styles.list, projects.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="Nenhum projeto neste evento"
            subtitle="Toque no + para criar um projeto"
          />
        }
        onRefresh={load}
        refreshing={loading}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push({ pathname: '/admin/projeto/novo', params: { event_id: id } } as any)}
        color={COLORS.white}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyMed,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerInfo: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, color: COLORS.textSecondary },
  projectsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  list: { padding: 14, paddingBottom: 80 },
  emptyList: { flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 20, backgroundColor: COLORS.primary },
});
