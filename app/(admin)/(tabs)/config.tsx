import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { ChecklistTemplate, Profile } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfigTab() {
  const { signOut, profile } = useAuth();
  const [produtores, setProdutores] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [prodRes, tmplRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'produtor').order('name'),
      supabase.from('checklist_templates').select('*').order('is_default', { ascending: false }),
    ]);
    if (prodRes.data) setProdutores(prodRes.data);
    if (tmplRes.data) setTemplates(tmplRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteProdutor = (id: string, name: string) => {
    Alert.alert(
      'Remover usuário',
      `Deseja remover ${name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('profiles').delete().eq('id', id);
            load();
          },
        },
      ],
    );
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    Alert.alert(
      'Remover template',
      `Deseja remover "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('checklist_templates').delete().eq('id', id);
            load();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* PRODUTORES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Produtores ({produtores.length})</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/admin/usuario/novo' as any)}
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.addBtnText}>Novo</Text>
            </TouchableOpacity>
          </View>

          {produtores.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum produtor cadastrado.</Text>
          ) : (
            produtores.map((p) => (
              <View key={p.id} style={styles.listItem}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{p.name}</Text>
                  <Text style={styles.itemSub}>{p.email}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteProdutor(p.id, p.name)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* TEMPLATES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="list-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Templates de Checklist ({templates.length})</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/admin/template/novo' as any)}
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.addBtnText}>Novo</Text>
            </TouchableOpacity>
          </View>

          {templates.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum template cadastrado.</Text>
          ) : (
            templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.listItem}
                onPress={() => router.push(`/admin/template/${t.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.templateIcon, t.is_default && styles.templateIconDefault]}>
                  <Ionicons name="list" size={18} color={t.is_default ? COLORS.secondary : COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.templateTitleRow}>
                    <Text style={styles.itemName}>{t.name}</Text>
                    {t.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Padrão</Text>
                      </View>
                    )}
                  </View>
                  {t.description && <Text style={styles.itemSub} numberOfLines={1}>{t.description}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteTemplate(t.id, t.name)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* CONTA */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Minha Conta</Text>
          </View>
          <View style={[styles.listItem, { marginTop: 8 }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{profile?.name}</Text>
              <Text style={styles.itemSub}>{profile?.email} • Admin</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyLight,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemSub: { fontSize: 12, color: COLORS.textSecondary },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: 'center', padding: 12 },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateIconDefault: { backgroundColor: COLORS.secondary + '15' },
  templateTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  defaultBadge: {
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: { fontSize: 10, color: COLORS.secondary, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.errorLight ?? '#FFEBEE',
  },
  logoutText: { color: COLORS.error, fontWeight: '600', fontSize: 14 },
});
