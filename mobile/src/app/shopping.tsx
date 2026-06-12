import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  FormField,
  FormModal,
  InfoState,
  LoadingState,
  SectionCard,
  Tag,
} from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { formatDate, formatQuantity, parseOptionalNumber, sanitizeOptionalText } from '@/lib/format';
import {
  deleteShoppingListItem,
  getActiveShoppingList,
  markShoppingItemPurchased,
  undoShoppingItemPurchase,
  upsertShoppingListItem,
} from '@/lib/services';
import { ShoppingListItem, ShoppingListItemInput } from '@/lib/types';

type ShoppingData = Awaited<ReturnType<typeof getActiveShoppingList>>;

function createEmptyForm(listId?: string | null): ShoppingListItemInput {
  return {
    shopping_list_id: listId ?? null,
    ingredient_name: '',
    planned_quantity: null,
    planned_unit: 'un',
    category: '',
    purchased_status: 'nao_comprado',
    purchased_quantity: null,
    notes: '',
  };
}

export default function ShoppingScreen() {
  const loadShopping = useCallback(() => getActiveShoppingList(), []);
  const shopping = useAsyncResource<ShoppingData>(loadShopping);
  const reload = shopping.reload;
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ingredientName, setIngredientName] = useState('');
  const [plannedQuantity, setPlannedQuantity] = useState('');
  const [plannedUnit, setPlannedUnit] = useState('un');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  function openCreate() {
    const form = createEmptyForm(shopping.data?.list.id);
    setEditingId(null);
    setIngredientName(form.ingredient_name);
    setPlannedQuantity('');
    setPlannedUnit(form.planned_unit ?? 'un');
    setCategory(form.category ?? '');
    setNotes(form.notes ?? '');
    setFormVisible(true);
  }

  function openEdit(item: ShoppingListItem) {
    setEditingId(item.id);
    setIngredientName(item.ingredient_name);
    setPlannedQuantity(item.planned_quantity === null ? '' : String(item.planned_quantity));
    setPlannedUnit(item.planned_unit ?? 'un');
    setCategory(item.category ?? '');
    setNotes(item.notes ?? '');
    setFormVisible(true);
  }

  async function handleSave() {
    if (!ingredientName.trim()) {
      Alert.alert('Ingrediente em falta', 'Indica o nome do ingrediente.');
      return;
    }

    setSaving(true);

    try {
      await upsertShoppingListItem({
        id: editingId ?? undefined,
        shopping_list_id: shopping.data?.list.id ?? null,
        ingredient_name: ingredientName,
        planned_quantity: parseOptionalNumber(plannedQuantity),
        planned_unit: sanitizeOptionalText(plannedUnit),
        category: sanitizeOptionalText(category),
        purchased_status: 'nao_comprado',
        notes: sanitizeOptionalText(notes),
      });

      setFormVisible(false);
      await shopping.reload();
    } catch (error) {
      Alert.alert('Erro ao guardar item', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(item: ShoppingListItem) {
    Alert.alert('Apagar item', `Queres apagar ${item.ingredient_name} da lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteShoppingListItem(item.id);
            await shopping.reload();
          } catch (error) {
            Alert.alert('Erro ao apagar', error instanceof Error ? error.message : 'Tenta novamente.');
          }
        },
      },
    ]);
  }

  async function handleTogglePurchased(item: ShoppingListItem) {
    try {
      if (item.purchased_status === 'comprado') {
        await undoShoppingItemPurchase(item);
      } else {
        await markShoppingItemPurchased(item);
      }

      await shopping.reload();
    } catch (error) {
      Alert.alert('Erro ao atualizar compra', error instanceof Error ? error.message : 'Tenta novamente.');
    }
  }

  return (
    <AppScreen refreshing={shopping.refreshing} onRefresh={() => void reload()}>
      <View style={styles.header}>
        <ThemedText type="title">Compras</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragraph}>
          Lista ativa de compras com ligação direta ao inventário quando marcas um item como comprado.
        </ThemedText>
      </View>

      <AppButton label="Novo item" onPress={openCreate} />

      {shopping.loading ? <LoadingState label="A carregar lista de compras..." /> : null}

      {shopping.error ? (
        <InfoState
          title="Não foi possível carregar compras"
          message={shopping.error}
          action={<AppButton label="Tentar novamente" onPress={() => void reload()} />}
        />
      ) : null}

      {shopping.data ? (
        <SectionCard>
          <ThemedText type="subtitle">Lista ativa</ThemedText>
          <ThemedText themeColor="textSecondary">
            Criada em {formatDate(shopping.data.list.created_at)} · estado {shopping.data.list.status}
          </ThemedText>
        </SectionCard>
      ) : null}

      {shopping.data && shopping.data.items.length === 0 ? (
        <InfoState title="Lista vazia" message="Ainda não há itens na lista ativa. Cria o primeiro item para arrancar." />
      ) : null}

      {shopping.data?.items.map((item) => (
        <SectionCard key={item.id}>
          <View style={styles.itemHeader}>
            <ThemedText type="subtitle" style={styles.itemTitle}>
              {item.ingredient_name}
            </ThemedText>
            <View style={styles.tags}>
              <Tag>{item.purchased_status}</Tag>
              {item.category ? <Tag>{item.category}</Tag> : null}
            </View>
          </View>

          <ThemedText themeColor="textSecondary">
            Planeado: {formatQuantity(item.planned_quantity, item.planned_unit)}
          </ThemedText>
          {item.notes ? (
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              {item.notes}
            </ThemedText>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              label={item.purchased_status === 'comprado' ? 'Desfazer compra' : 'Marcar comprado'}
              onPress={() => void handleTogglePurchased(item)}
            />
            <AppButton label="Editar" tone="secondary" onPress={() => openEdit(item)} />
            <AppButton label="Apagar" tone="danger" onPress={() => handleDelete(item)} />
          </View>
        </SectionCard>
      ))}

      <FormModal
        visible={formVisible}
        title={editingId ? 'Editar item' : 'Novo item'}
        onClose={() => setFormVisible(false)}
        footer={<AppButton label={saving ? 'A guardar...' : 'Guardar item'} onPress={() => void handleSave()} disabled={saving} />}>
        <FormField label="Ingrediente" value={ingredientName} onChangeText={setIngredientName} />
        <FormField label="Quantidade planeada" value={plannedQuantity} onChangeText={setPlannedQuantity} keyboardType="numeric" />
        <FormField label="Unidade" value={plannedUnit} onChangeText={setPlannedUnit} />
        <FormField label="Categoria" value={category} onChangeText={setCategory} />
        <FormField label="Notas" value={notes} onChangeText={setNotes} multiline />
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
  itemHeader: {
    gap: Spacing.two,
  },
  itemTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
  },
});
