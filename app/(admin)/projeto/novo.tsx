import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { ChecklistTemplate, Event, Profile, TemplateItem } from '@/lib/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NovoProjeto() {
  const params = useLocalSearchParams<{ event_id?: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>(params.event_id ?? '');
  const [selectedProducer, setSelectedProducer] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [useDefault, setUseDefault] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [producers, setProducers] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [defaultTemplate, setDefaultTemplate] = useState<ChecklistTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [evRes, prRes, tmRes] = await Promise.all([
      supabase.from('events').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'produtor').order('name'),
      supabase.from('checklist_templates').select('*').order('is_default', { ascending: false }),
    ]);
    if (evRes.data) setEvents(evRes.data);
    if (prRes.data) setProducers(prRes.data);
    if (tmRes.data) {
      setTemplates(tmRes.data);
      const def = tmRes.data.find((t: ChecklistTemplate) => t.is_default);
      if (def) {
        setDefaultTemplate(def);
        setSelectedTemplate(def.id);
      }
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const applyTemplate = async (projectId: string, templateId: string) => {
    const { data: items } = await supabase
      .from('template_items')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index');

    if (!items || items.length === 0) return;

    const tasks = (items as TemplateItem[]).map((item) => ({
      project_id: projectId,
      title: item.title,
      description: item.description,
      phase: item.phase,
      order_index: item.order_index,
      estimated_hours: item.estimated_hours,
      status: 'pendente' as const,
    }));

    await supabase.from('project_tasks').insert(tasks);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'Nome do projeto é obrigatório.'); return; }
    if (!selectedEvent) { Alert.alert('Atenção', 'Selecione um evento.'); return; }

    setSaving(true);

    const templateId = useDefault
      ? (defaultTemplate?.id ?? null)
      : (selectedTemplate || null);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        event_id: selectedEvent,
        producer_id: selectedProducer || null,
        template_id: templateId,
        status: 'pendente',
      })
      .select()
      .single();

    if (error) {
      Alert.alert('Erro', error.message);
      setSaving(false);
      return;
    }

    if (templateId && data) {
      await applyTemplate(data.id, templateId);
    }

    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>

          <Field label="Nome do Projeto / Stand *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Stand Samsung – Hall 7"
              placeholderTextColor={COLORS.greyMed}
            />
          </Field>

          <Field label="Descrição">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Detalhes do projeto..."
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.greyMed}
            />
          </Field>

          <Field label="Evento *">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {events.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.chip, selectedEvent === e.id && styles.chipActive]}
                  onPress={() => setSelectedEvent(e.id)}
                >
                  <Text style={[styles.chipText, selectedEvent === e.id && styles.chipTextActive]}>
                    {e.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>

          <Field label="Produtor Responsável">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              <TouchableOpacity
                style={[styles.chip, selectedProducer === '' && styles.chipActive]}
                onPress={() => setSelectedProducer('')}
              >
                <Text style={[styles.chipText, selectedProducer === '' && styles.chipTextActive]}>
                  Sem produtor
                </Text>
              </TouchableOpacity>
              {producers.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, selectedProducer === p.id && styles.chipActive]}
                  onPress={() => setSelectedProducer(p.id)}
                >
                  <Text style={[styles.chipText, selectedProducer === p.id && styles.chipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>

          <Field label="Template de Checklist">
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setUseDefault(!useDefault)}
            >
              <View style={[styles.toggle, useDefault && styles.toggleOn]} />
              <Text style={styles.toggleLabel}>
                {useDefault
                  ? `Usar template padrão: "${defaultTemplate?.name ?? 'Nenhum'}"`
                  : 'Escolher template manualmente'}
              </Text>
            </TouchableOpacity>

            {!useDefault && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.pickerScroll, { marginTop: 8 }]}>
                <TouchableOpacity
                  style={[styles.chip, selectedTemplate === '' && styles.chipActive]}
                  onPress={() => setSelectedTemplate('')}
                >
                  <Text style={[styles.chipText, selectedTemplate === '' && styles.chipTextActive]}>
                    Sem template
                  </Text>
                </TouchableOpacity>
                {templates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, selectedTemplate === t.id && styles.chipActive]}
                    onPress={() => setSelectedTemplate(t.id)}
                  >
                    <Text style={[styles.chipText, selectedTemplate === t.id && styles.chipTextActive]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Field>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Criar Projeto</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  pickerScroll: { maxHeight: 50 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.greyMed,
  },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleLabel: { fontSize: 13, color: COLORS.text, flex: 1 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
