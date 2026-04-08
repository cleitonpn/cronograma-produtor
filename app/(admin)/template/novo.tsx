import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { TaskPhase } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { ActivityIndicator, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Item {
  key: string;
  title: string;
  phase: TaskPhase;
  estimated_hours: string;
  order_index: number;
}

const PHASES: { value: TaskPhase; label: string }[] = [
  { value: 'pre_montagem', label: 'Pré-Montagem' },
  { value: 'montagem', label: 'Montagem' },
  { value: 'desmontagem', label: 'Desmontagem' },
];

export default function NovoTemplate() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: Date.now().toString(),
        title: '',
        phase: 'montagem',
        estimated_hours: '1',
        order_index: prev.length + 1,
      },
    ]);
  };

  const updateItem = (key: string, field: keyof Item, value: string) => {
    setItems((prev) => prev.map((item) => item.key === key ? { ...item, [field]: value } : item));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'Nome do template é obrigatório.'); return; }
    const validItems = items.filter((i) => i.title.trim());
    setSaving(true);

    const { data, error } = await supabase
      .from('checklist_templates')
      .insert({ name: name.trim(), description: description.trim() || null, is_default: isDefault })
      .select()
      .single();

    if (error) { Alert.alert('Erro', error.message); setSaving(false); return; }

    if (validItems.length > 0 && data) {
      await supabase.from('template_items').insert(
        validItems.map((item, idx) => ({
          template_id: data.id,
          title: item.title.trim(),
          phase: item.phase,
          estimated_hours: parseFloat(item.estimated_hours) || 0,
          order_index: idx + 1,
        })),
      );
    }

    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <Text style={styles.label}>Nome do Template *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Template Padrão de Montagem"
              placeholderTextColor={COLORS.greyMed}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descrição do template..."
              multiline
              placeholderTextColor={COLORS.greyMed}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Usar como Template Padrão</Text>
              <Text style={styles.switchSub}>Aplicado automaticamente quando nenhum template é escolhido</Text>
            </View>
            <Switch value={isDefault} onValueChange={setIsDefault} color={COLORS.primary} />
          </View>

          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Itens do Checklist ({items.length})</Text>
              <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.addItemText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, idx) => (
              <View key={item.key} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>#{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.key)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.itemInput}
                  value={item.title}
                  onChangeText={(v) => updateItem(item.key, 'title', v)}
                  placeholder="Título da tarefa..."
                  placeholderTextColor={COLORS.greyMed}
                />

                <View style={styles.itemRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.itemLabel}>Fase</Text>
                    <View style={styles.phaseChips}>
                      {PHASES.map((p) => (
                        <TouchableOpacity
                          key={p.value}
                          style={[styles.phaseChip, item.phase === p.value && styles.phaseChipActive]}
                          onPress={() => updateItem(item.key, 'phase', p.value)}
                        >
                          <Text style={[styles.phaseChipText, item.phase === p.value && styles.phaseChipTextActive]}>
                            {p.label.replace('-', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={{ width: 80, marginLeft: 10 }}>
                    <Text style={styles.itemLabel}>Horas est.</Text>
                    <TextInput
                      style={styles.hoursInput}
                      value={item.estimated_hours}
                      onChangeText={(v) => updateItem(item.key, 'estimated_hours', v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={COLORS.greyMed}
                    />
                  </View>
                </View>
              </View>
            ))}

            {items.length === 0 && (
              <Text style={styles.emptyItems}>Nenhum item. Toque em "Adicionar" para criar tarefas.</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Salvar Template</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
  },
  switchSub: { fontSize: 11, color: COLORS.grey, marginTop: 2, maxWidth: '85%' },
  itemsSection: { marginBottom: 16 },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addItemText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemNumber: { fontSize: 12, fontWeight: '700', color: COLORS.grey },
  itemInput: {
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
  },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start' },
  itemLabel: { fontSize: 11, color: COLORS.grey, marginBottom: 4, fontWeight: '600' },
  phaseChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  phaseChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    backgroundColor: COLORS.greyLight,
  },
  phaseChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  phaseChipText: { fontSize: 11, color: COLORS.textSecondary },
  phaseChipTextActive: { color: COLORS.white, fontWeight: '600' },
  hoursInput: {
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyItems: { fontSize: 13, color: COLORS.grey, textAlign: 'center', padding: 20 },
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
