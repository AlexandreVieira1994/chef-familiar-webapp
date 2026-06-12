import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  ButtonRow,
  FormField,
  FormModal,
  InfoState,
  LoadingState,
  SectionCard,
  SectionHeader,
  Tag,
} from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { formatDate, formatQuantity, isPastDate, parseOptionalNumber, sanitizeOptionalText } from '@/lib/format';
import { listInventoryEntries, softDeleteInventoryEntry, upsertInventoryEntry } from '@/lib/services';
import { InventoryEntry, InventoryEntryInput } from '@/lib/types';

function createEmptyForm(): InventoryEntryInput {
  return {
    entry_date: new Date().toISOString().slice(0, 10),
    ingredient_name: '',
    quantity_initial: 1,
    quantity_remaining: 1,
    unit: 'un',
    category: '',
    source: '',
    expiry_date: '',
    storage_location: '',
    status: 'disponivel',
    notes: '',
  };
}

function getDisplayStatus(entry: InventoryEntry) {
  if (entry.status === 'removido') return 'removido';
  if (entry.quantity_remaining <= 0) return 'sem_stock';
  if (isPastDate(entry.expiry_date)) return 'expirado';

  return entry.status || 'disponivel';
}

export default function InventoryScreen() {
  const loadInventory = useCallback(() => listInventoryEntries(), []);
  const inventory = useAsyncResource(loadInventory);
  const reload = inventory.reload;
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    ingredient_name: '',
    quantity_initial: '1',
    quantity_remaining: '1',
    unit: 'un',
    category: '',
    source: '',
    expiry_date: '',
    storage_location: '',
    status: 'disponivel',
    notes: '',
  });

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const activeEntries = useMemo(() => inventory.data ?? [], [inventory.data]);

  function openCreate() {
    const next = createEmptyForm();
    setEditingId(null);
    setForm({
      entry_date: next.entry_date,
      ingredient_name: next.ingredient_name,
      quantity_initial: String(next.quantity_initial),
      quantity_remaining: String(next.quantity_remaining),
      unit: next.unit,
      category: next.category ?? '',
      source: next.source ?? '',
      expiry_date: next.expiry_date ?? '',
      storage_location: next.storage_location ?? '',
      status: next.status ?? 'disponivel',
      notes: next.notes ?? '',
    });
    setFormVisible(true);
  }

  function openEdit(entry: InventoryEntry) {
    setEditingId(entry.id);
    setForm({
      entry_date: entry.entry_date,
      ingredient_name: entry.ingredient_name,
      quantity_initial: String(entry.quantity_initial),
      quantity_remaining: String(entry.quantity_remaining),
      unit: entry.unit,
      category: entry.category ?? '',
      source: entry.source ?? '',
      expiry_date: entry.expiry_date ?? '',
      storage_location: entry.storage_location ?? '',
      status: entry.status ?? 'disponivel',
      notes: entry.notes ?? '',
    });
    setFormVisible(true);
  }

  async function handleSave() {
    const quantityInitial = parseOptionalNumber(form.quantity_initial);
    const quantityRemaining = parseOptionalNumber(form.quantity_remaining);

    if (!form.ingredient_name.trim() || !form.unit.trim() || !form.entry_date.trim()) {
      Alert.alert('Campos em falta', 'Preenche ingrediente, unidade e data de entrada.');
      return;
    }

    if (quantityInitial === null || quantityRemaining === null) {
      Alert.alert('Quantidades inválidas', 'As quantidades têm de ser numéricas.');
      return;
    }

    setSaving(true);

    try {
      await upsertInventoryEntry({
        id: editingId ?? undefined,
        entry_date: form.entry_date,
        ingredient_name: form.ingredient_name,
        quantity_initial: quantityInitial,
        quantity_remaining: quantityRemaining,
        unit: form.unit,
        category: sanitizeOptionalText(form.category),
        source: sanitizeOptionalText(form.source),
        expiry_date: sanitizeOptionalText(form.expiry_date),
        storage_location: sanitizeOptionalText(form.storage_location),
        status: sanitizeOptionalText(form.status) ?? 'disponivel',
        notes: sanitizeOptionalText(form.notes),
      });

      setFormVisible(false);
      await inventory.reload();
    } catch (error) {
      Alert.alert('Erro ao guardar', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleSoftDelete(entry: InventoryEntry) {
    Alert.alert('Remover entrada', `Queres marcar ${entry.ingredient_name} como removido?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await softDeleteInventoryEntry(entry);
            await inventory.reload();
          } catch (error) {
            Alert.alert('Erro ao remover', error instanceof Error ? error.message : 'Tenta novamente.');
          }
        },
      },
    ]);
  }

  return (
    <AppScreen refreshing={inventory.refreshing} onRefresh={() => void reload()}>
      <View style={styles.header}>
        <ThemedText type="title">Inventário</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragraph}>
          Entradas por lote, com edição direta e remoção lógica para preservar histórico.
        </ThemedText>
      </View>

      <ButtonRow>
        <AppButton label="Nova entrada" onPress={openCreate} />
      </ButtonRow>

      {inventory.loading ? <LoadingState label="A carregar inventário..." /> : null}

      {inventory.error ? (
        <InfoState
          title="Não foi possível carregar o inventário"
          message={inventory.error}
          action={<AppButton label="Tentar novamente" onPress={() => void reload()} />}
        />
      ) : null}

      {inventory.data && inventory.data.length === 0 ? (
        <InfoState
          title="Inventário vazio"
          message="Ainda não tens entradas no inventário. Cria a primeira para começares a usar compras e planeamento."
        />
      ) : null}

      {activeEntries.length ? <SectionHeader>Entradas</SectionHeader> : null}
      {activeEntries.map((entry) => (
        <SectionCard key={entry.id}>
          <View style={styles.rowHeader}>
            <View style={styles.rowTitle}>
              <ThemedText type="subtitle" style={styles.entryTitle}>
                {entry.ingredient_name}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {formatQuantity(entry.quantity_remaining, entry.unit)} disponível de {formatQuantity(entry.quantity_initial, entry.unit)}
              </ThemedText>
            </View>
            <Tag>{getDisplayStatus(entry)}</Tag>
          </View>

          <View style={styles.metaWrap}>
            <Tag>entrada {formatDate(entry.entry_date)}</Tag>
            {entry.expiry_date ? <Tag>validade {formatDate(entry.expiry_date)}</Tag> : null}
            {entry.category ? <Tag>{entry.category}</Tag> : null}
            {entry.storage_location ? <Tag>{entry.storage_location}</Tag> : null}
          </View>

          {entry.notes ? (
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              {entry.notes}
            </ThemedText>
          ) : null}

          <ButtonRow>
            <AppButton label="Editar" tone="secondary" onPress={() => openEdit(entry)} />
            <AppButton label="Remover" tone="danger" onPress={() => handleSoftDelete(entry)} />
          </ButtonRow>
        </SectionCard>
      ))}

      <FormModal
        visible={formVisible}
        title={editingId ? 'Editar entrada' : 'Nova entrada'}
        onClose={() => setFormVisible(false)}
        footer={<AppButton label={saving ? 'A guardar...' : 'Guardar entrada'} onPress={() => void handleSave()} disabled={saving} />}>
        <FormField label="Ingrediente" value={form.ingredient_name} onChangeText={(ingredient_name) => setForm((current) => ({ ...current, ingredient_name }))} placeholder="Ex. arroz agulha" />
        <FormField label="Data de entrada" value={form.entry_date} onChangeText={(entry_date) => setForm((current) => ({ ...current, entry_date }))} placeholder="YYYY-MM-DD" />
        <FormField label="Quantidade inicial" value={form.quantity_initial} onChangeText={(quantity_initial) => setForm((current) => ({ ...current, quantity_initial }))} keyboardType="numeric" />
        <FormField label="Quantidade restante" value={form.quantity_remaining} onChangeText={(quantity_remaining) => setForm((current) => ({ ...current, quantity_remaining }))} keyboardType="numeric" />
        <FormField label="Unidade" value={form.unit} onChangeText={(unit) => setForm((current) => ({ ...current, unit }))} placeholder="g, kg, un..." />
        <FormField label="Categoria" value={form.category} onChangeText={(category) => setForm((current) => ({ ...current, category }))} />
        <FormField label="Origem" value={form.source} onChangeText={(source) => setForm((current) => ({ ...current, source }))} placeholder="compra, shopping_list..." />
        <FormField label="Validade" value={form.expiry_date} onChangeText={(expiry_date) => setForm((current) => ({ ...current, expiry_date }))} placeholder="YYYY-MM-DD" />
        <FormField label="Local" value={form.storage_location} onChangeText={(storage_location) => setForm((current) => ({ ...current, storage_location }))} placeholder="Despensa, frigorífico..." />
        <FormField label="Estado" value={form.status} onChangeText={(status) => setForm((current) => ({ ...current, status }))} />
        <FormField label="Notas" value={form.notes} onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} multiline />
      </FormModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
  },
  paragraph: {
    lineHeight: 21,
  },
  rowHeader: {
    gap: Spacing.two,
  },
  rowTitle: {
    gap: 4,
  },
  entryTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
  },
});
