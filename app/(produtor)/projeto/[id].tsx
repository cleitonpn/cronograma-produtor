import TaskCard from '@/components/TaskCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { DiaryEntry, PHASE_LABELS, Project, ProjectTask, TaskPhase } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';

const PHASES: TaskPhase[] = ['pre_montagem', 'montagem', 'desmontagem'];

export default function ProjetoProdutorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    pre_montagem: true, montagem: true, desmontagem: false,
  });
  const [diaryText, setDiaryText] = useState('');
  const [savingDiary, setSavingDiary] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'diario'>('checklist');
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    const [pRes, tRes, dRes] = await Promise.all([
      supabase.from('projects').select(`
        *,
        event:events(id, name, start_date, end_date, client, location),
        template:checklist_templates(id, name)
      `).eq('id', id).single(),
      supabase.from('project_tasks').select('*').eq('project_id', id).order('order_index'),
      supabase.from('diary_entries').select(`*, profile:profiles(name)`).eq('project_id', id).order('created_at', { ascending: false }),
    ]);
    if (pRes.data) {
      setProject(pRes.data as Project);
      navigation.setOptions({ title: pRes.data.name });
    }
    if (tRes.data) setTasks(tRes.data);
    if (dRes.data) setDiary(dRes.data);
    setLoading(false);
  }, [id, navigation]);

  useEffect(() => { load(); }, [load]);

  const updateProjectStatus = useCallback(async (currentTasks: ProjectTask[]) => {
    if (currentTasks.length === 0) return;
    const done = currentTasks.filter((t) => t.status === 'concluido').length;
    const newStatus = done === currentTasks.length ? 'concluido' : done > 0 ? 'em_andamento' : 'pendente';
    await supabase.from('projects').update({ status: newStatus }).eq('id', id);
    if (project) setProject({ ...project, status: newStatus });
  }, [id, project]);

  const handleStart = useCallback(async (taskId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('project_tasks')
      .update({ status: 'em_andamento', started_at: now })
      .eq('id', taskId);
    if (!error) {
      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'em_andamento' as const, started_at: now } : t,
      );
      setTasks(updated);
      await updateProjectStatus(updated);
    }
  }, [tasks, updateProjectStatus]);

  const handleComplete = useCallback(async (taskId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('project_tasks')
      .update({ status: 'concluido', completed_at: now })
      .eq('id', taskId);
    if (!error) {
      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'concluido' as const, completed_at: now } : t,
      );
      setTasks(updated);
      await updateProjectStatus(updated);
    }
  }, [tasks, updateProjectStatus]);

  const handleSaveNotes = useCallback(async (taskId: string, notes: string) => {
    await supabase.from('project_tasks').update({ notes }).eq('id', taskId);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, notes } : t));
  }, []);

  const handleAddDiaryEntry = async () => {
    if (!diaryText.trim() || !profile) return;
    setSavingDiary(true);
    const { data, error } = await supabase.from('diary_entries').insert({
      project_id: id,
      producer_id: profile.id,
      content: diaryText.trim(),
    }).select(`*, profile:profiles(name)`).single();

    if (!error && data) {
      setDiary((prev) => [data as DiaryEntry, ...prev]);
      setDiaryText('');
    } else {
      Alert.alert('Erro', 'Não foi possível salvar a entrada.');
    }
    setSavingDiary(false);
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const done = tasks.filter((t) => t.status === 'concluido').length;
  const inProgress = tasks.filter((t) => t.status === 'em_andamento').length;
  const pct = tasks.length > 0 ? done / tasks.length : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {project && (
          <View style={styles.projectHeader}>
            <View style={styles.headerRow}>
              <StatusBadge status={project.status} type="project" />
              {project.event && (
                <Text style={styles.eventName}>{project.event.name}</Text>
              )}
            </View>
            {project.event?.start_date && (
              <Text style={styles.dates}>
                {formatDate(project.event.start_date)} → {formatDate(project.event.end_date)}
              </Text>
            )}
            <View style={styles.progressRow}>
              <ProgressBar progress={pct} color={pct === 1 ? COLORS.success : COLORS.primary} style={styles.bar} />
              <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
            </View>
            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatValue, { color: COLORS.primary }]}>{inProgress}</Text>
                <Text style={styles.miniStatLabel}>Em andamento</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatValue, { color: COLORS.success }]}>{done}</Text>
                <Text style={styles.miniStatLabel}>Concluídas</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatValue, { color: COLORS.grey }]}>{tasks.length - done - inProgress}</Text>
                <Text style={styles.miniStatLabel}>Pendentes</Text>
              </View>
            </View>
          </View>
        )}

        {/* TABS */}
        <View style={styles.tabsBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'checklist' && styles.tabActive]}
            onPress={() => setActiveTab('checklist')}
          >
            <Ionicons name="checkbox-outline" size={14} color={activeTab === 'checklist' ? COLORS.primary : COLORS.grey} />
            <Text style={[styles.tabText, activeTab === 'checklist' && styles.tabTextActive]}>
              Checklist ({done}/{tasks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'diario' && styles.tabActive]}
            onPress={() => setActiveTab('diario')}
          >
            <Ionicons name="book-outline" size={14} color={activeTab === 'diario' ? COLORS.primary : COLORS.grey} />
            <Text style={[styles.tabText, activeTab === 'diario' && styles.tabTextActive]}>
              Diário ({diary.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'checklist' ? (
          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {PHASES.map((phase) => {
              const phaseTasks = tasks.filter((t) => t.phase === phase);
              if (phaseTasks.length === 0) return null;
              const expanded = expandedPhases[phase] !== false;
              const phaseDone = phaseTasks.filter((t) => t.status === 'concluido').length;

              return (
                <View key={phase} style={styles.phaseSection}>
                  <TouchableOpacity
                    style={styles.phaseHeader}
                    onPress={() => setExpandedPhases((prev) => ({ ...prev, [phase]: !expanded }))}
                  >
                    <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color={COLORS.grey} />
                    <Text style={styles.phaseTitle}>{PHASE_LABELS[phase]}</Text>
                    <View style={styles.phasePill}>
                      <Text style={styles.phasePillText}>{phaseDone}/{phaseTasks.length}</Text>
                    </View>
                  </TouchableOpacity>

                  {expanded && phaseTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canEdit
                      onStart={handleStart}
                      onComplete={handleComplete}
                      onSaveNotes={handleSaveNotes}
                    />
                  ))}
                </View>
              );
            })}

            {tasks.length === 0 && (
              <View style={styles.emptyTasks}>
                <Ionicons name="clipboard-outline" size={40} color={COLORS.greyMed} />
                <Text style={styles.emptyText}>Nenhuma tarefa criada para este projeto ainda.</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Diary input */}
            <View style={styles.diaryInputCard}>
              <Text style={styles.diaryInputTitle}>Nova entrada no diário</Text>
              <TextInput
                style={styles.diaryInput}
                value={diaryText}
                onChangeText={setDiaryText}
                placeholder="Descreva o que aconteceu no projeto hoje..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={COLORS.greyMed}
              />
              <TouchableOpacity
                style={[styles.diaryBtn, (!diaryText.trim() || savingDiary) && styles.diaryBtnDisabled]}
                onPress={handleAddDiaryEntry}
                disabled={!diaryText.trim() || savingDiary}
              >
                {savingDiary ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={16} color={COLORS.white} />
                    <Text style={styles.diaryBtnText}>Registrar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {diary.length === 0 ? (
              <View style={styles.emptyTasks}>
                <Ionicons name="book-outline" size={40} color={COLORS.greyMed} />
                <Text style={styles.emptyText}>Nenhuma entrada no diário. Registre o andamento das atividades.</Text>
              </View>
            ) : (
              diary.map((entry) => (
                <View key={entry.id} style={styles.diaryEntry}>
                  <View style={styles.diaryEntryHeader}>
                    <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.diaryAuthor}>{entry.profile?.name ?? 'Produtor'}</Text>
                    <Text style={styles.diaryDate}>
                      {new Date(entry.created_at).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.diaryContent}>{entry.content}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  projectHeader: {
    backgroundColor: COLORS.primary,
    padding: 14,
    paddingBottom: 12,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  eventName: { fontSize: 12, color: 'rgba(255,255,255,0.8)', flex: 1, textAlign: 'right' },
  dates: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressPct: { color: COLORS.white, fontWeight: '700', fontSize: 13, minWidth: 35 },
  miniStats: { flexDirection: 'row', gap: 12 },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '800' },
  miniStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyMed,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 40 },
  phaseSection: { marginBottom: 16 },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  phaseTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  phasePill: {
    backgroundColor: COLORS.greyLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  phasePillText: { fontSize: 11, color: COLORS.grey, fontWeight: '600' },
  emptyTasks: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.grey, textAlign: 'center' },
  diaryInputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  diaryInputTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  diaryInput: {
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  diaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  diaryBtnDisabled: { opacity: 0.5 },
  diaryBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  diaryEntry: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  diaryEntryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  diaryAuthor: { fontSize: 12, fontWeight: '600', color: COLORS.text, flex: 1 },
  diaryDate: { fontSize: 11, color: COLORS.grey },
  diaryContent: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
});
