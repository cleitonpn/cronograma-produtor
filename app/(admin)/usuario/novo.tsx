import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
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
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NovoUsuario() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);

    // Call the edge function to create user server-side
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { name: name.trim(), email: email.trim().toLowerCase(), password },
    });

    setSaving(false);

    if (error || data?.error) {
      Alert.alert('Erro ao criar usuário', error?.message ?? data?.error ?? 'Erro desconhecido');
      return;
    }

    Alert.alert(
      'Usuário criado!',
      `${name} foi cadastrado com sucesso. Compartilhe o e-mail e senha com o produtor.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Crie as credenciais de acesso para o produtor. Após o cadastro, compartilhe o e-mail e senha manualmente.
            </Text>
          </View>

          <Field label="Nome completo *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: João Silva"
              autoCapitalize="words"
              placeholderTextColor={COLORS.greyMed}
            />
          </Field>

          <Field label="E-mail *">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="produtor@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.greyMed}
            />
          </Field>

          <Field label="Senha *">
            <View style={styles.passWrapper}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry={!showPass}
                placeholderTextColor={COLORS.greyMed}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.grey} />
              </TouchableOpacity>
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
              <Text style={styles.saveBtnText}>Criar Produtor</Text>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.primaryContainer ?? '#E3F2FD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: { fontSize: 13, color: COLORS.primary, flex: 1, lineHeight: 18 },
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
  passWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.greyMed,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 4,
  },
  eyeBtn: { padding: 8 },
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
