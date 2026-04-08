import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';
import { Event } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventosTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*, project_count:projects(count)')
      .order('created_at', { ascending: false });
    if (data) {
      const parsed = data.map((e: any) => ({
        ...e,
        project_count: e.project_count?.[0]?.count ?? 0,
      }));
      setEvents(parsed);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/admin/evento/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <StatusBadge status={item.status} type="event" small />
      </View>
      {item.client && (
        <View style={styles.row}>
          <Ionicons name="business-outline" size={13} color={COLORS.grey} />
          <Text style={styles.meta}>{item.client}</Text>
        </View>
      )}
      {item.location && (
        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color={COLORS.grey} />
          <Text style={styles.meta}>{item.location}</Text>
        </View>
      )}
      <View style={styles.cardFooter}>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.grey} />
          <Text style={styles.meta}>
            {formatDate(item.start_date)} → {formatDate(item.end_date)}
          </Text>
        </View>
        <View style={styles.projBadge}>
          <Ionicons name="construct-outline" size={12} color={COLORS.primary} />
          <Text style={styles.projCount}>{item.project_count} proj.</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, events.length === 0 && styles.emptyList]}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Nenhum evento cadastrado"
              subtitle="Toque no + para criar o primeiro evento"
            />
          }
          onRefresh={load}
          refreshing={loading}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/admin/evento/novo' as any)}
        color={COLORS.white}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 14, paddingBottom: 80 },
  emptyList: { flex: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  projBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  projCount: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: COLORS.primary,
  },
});
