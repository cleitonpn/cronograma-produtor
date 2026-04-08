import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { EventStatus } from '@/lib/types';
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
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'concluido', label: 'Concluído' },
];

export default function NovoEvento() {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<EventStatus>('planejamento');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Nome do evento é obrigatório.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('events').insert({
      name: name.trim(),
      client: client.trim() || null,
      location: location.trim() || null,
      start_date: startDate.trim() || null,
      end_date: endDate.trim() || null,
      status,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <Field label="Nome do Evento *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Expo Móvel 2025"
              placeholderTextColor={COLORS.greyMed}
            />
          </Field>

          <Field label="Cliente / Expositor">
            <TextInput
              style={styles.input}
              value={client}
              onChangeText={setClient}
              placeholder="Nome da empresa"
              placeholderTextColor={COLORS.greyMed}
            />
          </Field>

          <Field label="Local / Pavilhão">
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Pavilhão Norte – Anhembi"
              placeholderTextColor={COLORS.greyMed}
            />
          </Field>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Data de Início">
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={COLORS.greyMed}
                />
              </Field>
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Field label="Data de Fim">
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={COLORS.greyMed}
                />
              </Field>
            </View>
          </View>

          <Field label="Status">
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusBtn, status === opt.value && styles.statusBtnActive]}
                  onPress={() => setStatus(opt.value)}
                >
                  <Text style={[styles.statusBtnText, status === opt.value && styles.statusBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Criar Evento</Text>
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
  row: { flexDirection: 'row' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  statusBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusBtnText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  statusBtnTextActive: { color: COLORS.white },
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
