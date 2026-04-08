import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Stats {
  totalEvents: number;
  activeEvents: number;
  totalProjects: number;
  projectsInProgress: number;
  projectsDone: number;
  totalTasks: number;
  tasksDone: number;
  totalProdutores: number;
}

function StatCard({
  label, value, icon, color, onPress,
}: {
  label: string; value: number; icon: keyof typeof Ionicons.glyphMap; color: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0, activeEvents: 0,
    totalProjects: 0, projectsInProgress: 0, projectsDone: 0,
    totalTasks: 0, tasksDone: 0, totalProdutores: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const [eventsRes, projectsRes, tasksRes, produtoresRes] = await Promise.all([
      supabase.from('events').select('status'),
      supabase.from('projects').select('status'),
      supabase.from('project_tasks').select('status'),
      supabase.from('profiles').select('id').eq('role', 'produtor'),
    ]);

    const events = eventsRes.data ?? [];
    const projects = projectsRes.data ?? [];
    const tasks = tasksRes.data ?? [];

    setStats({
      totalEvents: events.length,
      activeEvents: events.filter((e) => e.status === 'ativo').length,
      totalProjects: projects.length,
      projectsInProgress: projects.filter((p) => p.status === 'em_andamento').length,
      projectsDone: projects.filter((p) => p.status === 'concluido').length,
      totalTasks: tasks.length,
      tasksDone: tasks.filter((t) => t.status === 'concluido').length,
      totalProdutores: produtoresRes.data?.length ?? 0,
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const overallProgress = stats.totalTasks > 0
    ? Math.round((stats.tasksDone / stats.totalTasks) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>Olá, {profile?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.welcomeSub}>Visão geral da operação</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progresso Global de Tarefas</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
            </View>
            <Text style={styles.progressPct}>{overallProgress}%</Text>
          </View>
          <Text style={styles.progressSub}>{stats.tasksDone} de {stats.totalTasks} tarefas concluídas</Text>
        </View>

        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Eventos Ativos"
            value={stats.activeEvents}
            icon="calendar"
            color={COLORS.primary}
            onPress={() => router.push('/(admin)/(tabs)/eventos')}
          />
          <StatCard
            label="Total de Eventos"
            value={stats.totalEvents}
            icon="calendar-outline"
            color="#7B1FA2"
            onPress={() => router.push('/(admin)/(tabs)/eventos')}
          />
          <StatCard
            label="Projetos em Andamento"
            value={stats.projectsInProgress}
            icon="construct"
            color={COLORS.secondary}
            onPress={() => router.push('/(admin)/(tabs)/projetos')}
          />
          <StatCard
            label="Projetos Concluídos"
            value={stats.projectsDone}
            icon="checkmark-circle"
            color={COLORS.success}
            onPress={() => router.push('/(admin)/(tabs)/projetos')}
          />
          <StatCard
            label="Total de Projetos"
            value={stats.totalProjects}
            icon="folder-outline"
            color="#0097A7"
            onPress={() => router.push('/(admin)/(tabs)/projetos')}
          />
          <StatCard
            label="Produtores"
            value={stats.totalProdutores}
            icon="people-outline"
            color="#558B2F"
            onPress={() => router.push('/(admin)/(tabs)/config')}
          />
        </View>

        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActions}>
          {[
            { label: 'Novo Evento', icon: 'calendar-outline', path: '/admin/evento/novo', color: COLORS.primary },
            { label: 'Novo Projeto', icon: 'construct-outline', path: '/admin/projeto/novo', color: COLORS.secondary },
            { label: 'Novo Template', icon: 'list-outline', path: '/admin/template/novo', color: '#7B1FA2' },
            { label: 'Novo Usuário', icon: 'person-add-outline', path: '/admin/usuario/novo', color: '#558B2F' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickBtn}
              onPress={() => router.push(action.path as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  welcomeSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  logoutBtn: { padding: 8 },
  progressCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  progressTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.white, borderRadius: 4 },
  progressPct: { color: COLORS.white, fontWeight: '700', fontSize: 16, minWidth: 40 },
  progressSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '47.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    width: '47.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    gap: 8,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
});
