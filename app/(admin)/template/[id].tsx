import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { ChecklistTemplate, PHASE_LABELS, TemplateItem } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
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

const PHASES = ['pre_montagem', 'montagem', 'desmontagem'] as const;

export default function TemplateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [tRes, iRes] = await Promise.all([
      supabase.from('checklist_templates').select('*').eq('id', id).single(),
      supabase.from('template_items').select('*').eq('template_id', id).order('order_index'),
    ]);
    if (tRes.data) {
      setTemplate(tRes.data);
      navigation.setOptions({ title: tRes.data.name });
    }
    if (iRes.data) setItems(iRes.data);
    setLoading(false);
  }, [id, navigation]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = () => {
    Alert.alert('Excluir Template', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await supabase.from('checklist_templates').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  const handleDeleteItem = async (itemId: string) => {
    await supabase.from('template_items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {template && (
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                {template.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Template Padrão</Text>
                  </View>
                )}
                {template.description && (
                  <Text style={styles.description}>{template.description}</Text>
                )}
              </View>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.summary}>{items.length} itens no total</Text>
          </View>
        )}

        {PHASES.map((phase) => {
          const phaseItems = items.filter((i) => i.phase === phase);
          if (phaseItems.length === 0) return null;

          return (
            <View key={phase} style={styles.phaseSection}>
              <Text style={styles.phaseTitle}>{PHASE_LABELS[phase]}</Text>
              {phaseItems.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{item.order_index}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.estimated_hours > 0 && (
                      <Text style={styles.itemHours}>{item.estimated_hours}h estimadas</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  defaultText: { fontSize: 11, color: COLORS.secondary, fontWeight: '700' },
  description: { fontSize: 13, color: COLORS.textSecondary },
  summary: { fontSize: 12, color: COLORS.grey },
  phaseSection: { marginBottom: 16 },
  phaseTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary + '60',
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  itemTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  itemHours: { fontSize: 11, color: COLORS.grey, marginTop: 2 },
});
