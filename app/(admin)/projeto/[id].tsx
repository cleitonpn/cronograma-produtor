import StatusBadge from '@/components/StatusBadge';
import TaskCard from '@/components/TaskCard';
import { formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { DiaryEntry, PHASE_LABELS, Profile, Project, ProjectTask, TaskPhase } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const PHASES: TaskPhase[] = ['pre_montagem', 'montagem', 'desmontagem'];

export default function ProjetoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [producers, setProducers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    pre_montagem: true, montagem: true, desmontagem: false,
  });

  const load = useCallback(async () => {
    const [pRes, tRes, dRes] = await Promise.all([
      supabase.from('projects').select(`
        *,
        event:events(id, name, start_date, end_date, client, location),
        producer:profiles!projects_producer_id_fkey(id, name, email),
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
  }, [id]);

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
      await load();
    }
  }, [tasks, updateProjectStatus, load]);

  const handleSaveNotes = useCallback(async (taskId: string, notes: string) => {
    await supabase.from('project_tasks').update({ notes }).eq('id', taskId);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, notes } : t));
  }, []);

  const handleDelete = () => {
    Alert.alert('Excluir Projeto', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await supabase.from('projects').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  const generateReport = async () => {
    if (!project) return;
    setExporting(true);
    const done = tasks.filter((t) => t.status === 'concluido').length;
    const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

    const phaseRows = PHASES.map((phase) => {
      const phaseTasks = tasks.filter((t) => t.phase === phase);
      const phaseDone = phaseTasks.filter((t) => t.status === 'concluido').length;
      const rows = phaseTasks.map((t) => `
        <tr>
          <td>${t.title}</td>
          <td style="text-align:center">${t.status === 'concluido' ? '✅' : t.status === 'em_andamento' ? '🔄' : '⏳'}</td>
          <td>${t.started_at ? new Date(t.started_at).toLocaleString('pt-BR') : '-'}</td>
          <td>${t.completed_at ? new Date(t.completed_at).toLocaleString('pt-BR') : '-'}</td>
          <td>${t.notes ?? '-'}</td>
        </tr>`).join('');
      return `
        <h3 style="color:#1565C0;margin-top:20px">${PHASE_LABELS[phase]} (${phaseDone}/${phaseTasks.length})</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px">
          <tr style="background:#E3F2FD">
            <th>Tarefa</th><th>Status</th><th>Iniciado</th><th>Concluído</th><th>Observações</th>
          </tr>
          ${rows || '<tr><td colspan="5" style="text-align:center;color:#999">Nenhuma tarefa</td></tr>'}
        </table>`;
    }).join('');

    const html = `
      <html><body style="font-family:Arial,sans-serif;padding:20px;color:#212121">
        <h1 style="color:#1565C0">Relatório de Projeto</h1>
        <h2>${project.name}</h2>
        <table style="width:100%;margin-bottom:16px;font-size:13px">
          <tr><td><b>Evento:</b></td><td>${project.event?.name ?? '-'}</td>
              <td><b>Cliente:</b></td><td>${project.event?.client ?? '-'}</td></tr>
          <tr><td><b>Produtor:</b></td><td>${project.producer?.name ?? '-'}</td>
              <td><b>Status:</b></td><td>${project.status}</td></tr>
          <tr><td><b>Início:</b></td><td>${formatDate(project.event?.start_date ?? null)}</td>
              <td><b>Fim:</b></td><td>${formatDate(project.event?.end_date ?? null)}</td></tr>
        </table>
        <div style="background:#E3F2FD;padding:12px;border-radius:8px;margin-bottom:16px">
          <b>Progresso geral: ${pct}%</b> — ${done} de ${tasks.length} tarefas concluídas
        </div>
        ${phaseRows}
        <p style="color:#999;font-size:11px;margin-top:30px">
          Gerado em ${new Date().toLocaleString('pt-BR')} via Cronograma Produtor
        </p>
      </body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Exportar Relatório' });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível gerar o relatório.');
    }
    setExporting(false);
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const done = tasks.filter((t) => t.status === 'concluido').length;
  const pct = tasks.length > 0 ? done / tasks.length : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {project && (
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <StatusBadge status={project.status} type="project" />
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={generateReport} disabled={exporting} style={styles.exportBtn}>
                  {exporting ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="document-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.exportText}>PDF</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>

            {project.event && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.grey} />
                  <Text style={styles.infoText}>{project.event.name}</Text>
                </View>
                {project.event.client && (
                  <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={13} color={COLORS.grey} />
                    <Text style={styles.infoText}>{project.event.client}</Text>
                  </View>
                )}
              </>
            )}
            {project.producer && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={13} color={COLORS.grey} />
                <Text style={styles.infoText}>{project.producer.name}</Text>
              </View>
            )}
            {project.template && (
              <View style={styles.infoRow}>
                <Ionicons name="list-outline" size={13} color={COLORS.grey} />
                <Text style={styles.infoText}>Template: {project.template.name}</Text>
              </View>
            )}

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{done}/{tasks.length} tarefas</Text>
                <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
              </View>
              <ProgressBar progress={pct} color={pct === 1 ? COLORS.success : COLORS.primary} style={styles.bar} />
            </View>
          </View>
        )}

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
                <View style={styles.phaseLeft}>
                  <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color={COLORS.grey} />
                  <Text style={styles.phaseTitle}>{PHASE_LABELS[phase]}</Text>
                  <Text style={styles.phaseCount}>{phaseDone}/{phaseTasks.length}</Text>
                </View>
              </TouchableOpacity>

              {expanded && phaseTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  canEdit={false}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onSaveNotes={handleSaveNotes}
                />
              ))}
            </View>
          );
        })}

        {diary.length > 0 && (
          <View style={styles.phaseSection}>
            <Text style={[styles.phaseTitle, { marginBottom: 10 }]}>Diário de Obra</Text>
            {diary.map((entry) => (
              <View key={entry.id} style={styles.diaryEntry}>
                <Text style={styles.diaryDate}>
                  {entry.profile?.name} • {new Date(entry.created_at).toLocaleString('pt-BR')}
                </Text>
                <Text style={styles.diaryContent}>{entry.content}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  header: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  exportText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  infoText: { fontSize: 13, color: COLORS.textSecondary },
  progressSection: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, color: COLORS.textSecondary },
  progressPct: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  bar: { height: 8, borderRadius: 4, backgroundColor: COLORS.greyMed },
  phaseSection: { marginBottom: 14 },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  phaseLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phaseTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  phaseCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.grey,
    backgroundColor: COLORS.greyLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  diaryEntry: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  diaryDate: { fontSize: 11, color: COLORS.grey, marginBottom: 4 },
  diaryContent: { fontSize: 13, color: COLORS.text },
});
