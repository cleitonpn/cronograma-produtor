import { formatDateTime, formatDuration } from '@/lib/format';
import { COLORS } from '@/lib/theme';
import { ProjectTask, TASK_STATUS_LABELS } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { STATUS_COLORS } from '@/lib/theme';

interface Props {
  task: ProjectTask;
  canEdit?: boolean;
  onStart?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  onSaveNotes?: (id: string, notes: string) => Promise<void>;
}

export default function TaskCard({ task, canEdit = false, onStart, onComplete, onSaveNotes }: Props) {
  const [loading, setLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes ?? '');

  const colors = STATUS_COLORS.task[task.status] ?? { bg: '#F5F5F5', text: '#616161', border: '#E0E0E0' };

  const handleStart = async () => {
    if (!onStart) return;
    setLoading(true);
    await onStart(task.id);
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    setLoading(true);
    await onComplete(task.id);
    setLoading(false);
  };

  const handleSaveNotes = async () => {
    if (!onSaveNotes) return;
    await onSaveNotes(task.id, notes);
    setEditingNotes(false);
  };

  return (
    <View style={[styles.card, { borderLeftColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.statusDot, { backgroundColor: colors.border }]} />
          <Text style={styles.title}>{task.title}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {TASK_STATUS_LABELS[task.status]}
          </Text>
        </View>
      </View>

      {task.description ? (
        <Text style={styles.description}>{task.description}</Text>
      ) : null}

      <View style={styles.timestamps}>
        {task.estimated_hours ? (
          <View style={styles.timeRow}>
            <Ionicons name="hourglass-outline" size={12} color={COLORS.grey} />
            <Text style={styles.timeText}>Estimado: {task.estimated_hours}h</Text>
          </View>
        ) : null}
        {task.started_at ? (
          <View style={styles.timeRow}>
            <Ionicons name="play-circle-outline" size={12} color={COLORS.primary} />
            <Text style={styles.timeText}>Iniciado: {formatDateTime(task.started_at)}</Text>
          </View>
        ) : null}
        {task.completed_at ? (
          <View style={styles.timeRow}>
            <Ionicons name="checkmark-circle-outline" size={12} color={COLORS.success} />
            <Text style={styles.timeText}>
              Concluído: {formatDateTime(task.completed_at)}
              {task.started_at && ` (${formatDuration(task.started_at, task.completed_at)})`}
            </Text>
          </View>
        ) : null}
      </View>

      {canEdit && (
        <>
          {(task.notes || editingNotes) && (
            <View style={styles.notesSection}>
              {editingNotes ? (
                <>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Observações..."
                    multiline
                    autoFocus
                  />
                  <View style={styles.notesActions}>
                    <TouchableOpacity onPress={() => setEditingNotes(false)}>
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveNotes} style={styles.saveBtn}>
                      <Text style={styles.saveText}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity onPress={() => setEditingNotes(true)}>
                  <Text style={styles.notesText}>{task.notes}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.actions}>
            {task.status === 'pendente' && (
              <>
                {!editingNotes && (
                  <TouchableOpacity
                    onPress={() => setEditingNotes(true)}
                    style={styles.notesBtn}
                  >
                    <Ionicons name="create-outline" size={14} color={COLORS.grey} />
                    <Text style={styles.notesBtnText}>Obs.</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleStart} style={styles.startBtn} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="play" size={14} color={COLORS.white} />
                      <Text style={styles.btnText}>Iniciar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {task.status === 'em_andamento' && (
              <TouchableOpacity onPress={handleComplete} style={styles.doneBtn} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                    <Text style={styles.btnText}>Finalizar</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 16,
    marginBottom: 6,
  },
  timestamps: {
    marginLeft: 16,
    gap: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  notesSection: {
    marginTop: 8,
    marginLeft: 16,
    backgroundColor: COLORS.greyLight,
    borderRadius: 6,
    padding: 8,
  },
  notesInput: {
    fontSize: 12,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  cancelText: {
    fontSize: 12,
    color: COLORS.grey,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  notesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    gap: 4,
  },
  notesBtnText: {
    fontSize: 12,
    color: COLORS.grey,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  btnText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
});
