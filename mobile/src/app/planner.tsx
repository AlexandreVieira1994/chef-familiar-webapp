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
  SelectField,
  Tag,
} from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { formatDate, parseOptionalNumber, sanitizeOptionalText } from '@/lib/format';
import { mealSlotOptions } from '@/lib/options';
import { deleteMealPlanEntry, listMealPlanEntries, listRecipes, upsertMealPlanEntry } from '@/lib/services';
import { MealPlanEntryWithRecipe, MealSlot, Recipe } from '@/lib/types';

type PlannerData = {
  entries: MealPlanEntryWithRecipe[];
  recipes: Recipe[];
};

export default function PlannerScreen() {
  const loadPlanner = useCallback(async () => {
    const [entries, recipes] = await Promise.all([listMealPlanEntries(), listRecipes()]);
    return { entries, recipes };
  }, []);
  const planner = useAsyncResource<PlannerData>(loadPlanner);
  const reload = planner.reload;
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [mealSlot, setMealSlot] = useState<MealSlot>('jantar');
  const [recipeId, setRecipeId] = useState('');
  const [servingsNeeded, setServingsNeeded] = useState('4');
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const recipes = useMemo(() => planner.data?.recipes ?? [], [planner.data?.recipes]);

  function openCreate() {
    setEditingId(null);
    setPlannedDate(new Date().toISOString().slice(0, 10));
    setMealSlot('jantar');
    setRecipeId(recipes[0]?.id ?? '');
    setServingsNeeded(String(recipes[0]?.servings ?? 4));
    setNotes('');
    setFormVisible(true);
  }

  function openEdit(entry: MealPlanEntryWithRecipe) {
    setEditingId(entry.id);
    setPlannedDate(entry.planned_date);
    setMealSlot(entry.meal_slot);
    setRecipeId(entry.recipe_id);
    setServingsNeeded(String(entry.servings_needed));
    setNotes(entry.notes ?? '');
    setFormVisible(true);
  }

  async function handleSave() {
    const parsedServings = parseOptionalNumber(servingsNeeded);

    if (!plannedDate.trim() || !recipeId) {
      Alert.alert('Campos em falta', 'Escolhe a data e a receita.');
      return;
    }

    if (!parsedServings || parsedServings <= 0) {
      Alert.alert('Doses inválidas', 'Indica quantas doses são necessárias para esta refeição.');
      return;
    }

    setSaving(true);

    try {
      await upsertMealPlanEntry({
        id: editingId ?? undefined,
        planned_date: plannedDate,
        meal_slot: mealSlot,
        recipe_id: recipeId,
        servings_needed: parsedServings,
        notes: sanitizeOptionalText(notes),
      });
      setFormVisible(false);
      await planner.reload();
    } catch (error) {
      Alert.alert('Erro ao guardar refeição', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(entry: MealPlanEntryWithRecipe) {
    Alert.alert('Remover refeição', 'Queres apagar esta entrada do plano?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMealPlanEntry(entry.id);
            await planner.reload();
          } catch (error) {
            Alert.alert('Erro ao apagar', error instanceof Error ? error.message : 'Tenta novamente.');
          }
        },
      },
    ]);
  }

  return (
    <AppScreen refreshing={planner.refreshing} onRefresh={() => void reload()}>
      <View style={styles.header}>
        <ThemedText type="title">Plano semanal</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragraph}>
          Gestão manual das refeições planeadas por data e momento do dia, ligadas às receitas reais.
        </ThemedText>
      </View>

      <ButtonRow>
        <AppButton label="Nova refeição" onPress={openCreate} />
      </ButtonRow>

      {planner.loading ? <LoadingState label="A carregar plano..." /> : null}

      {planner.error ? (
        <InfoState
          title="Não foi possível carregar o plano"
          message={planner.error}
          action={<AppButton label="Tentar novamente" onPress={() => void reload()} />}
        />
      ) : null}

      {planner.data && planner.data.entries.length === 0 ? (
        <InfoState title="Sem refeições planeadas" message="Ainda não existem entradas no plano semanal. Cria a primeira refeição para arrancar." />
      ) : null}

      {planner.data?.entries.length ? <SectionHeader>Refeições planeadas</SectionHeader> : null}
      {planner.data?.entries.map((entry) => (
        <SectionCard key={entry.id}>
          <View style={styles.entryHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {formatDate(entry.planned_date)}
            </ThemedText>
            <View style={styles.tags}>
              <Tag>{entry.meal_slot}</Tag>
              <Tag>{entry.servings_needed} doses</Tag>
              {entry.recipe?.status ? <Tag>{entry.recipe.status}</Tag> : null}
            </View>
            <ThemedText type="subtitle" style={styles.entryTitle}>
              {entry.recipe?.name ?? 'Receita removida'}
            </ThemedText>
          </View>

          {entry.notes ? (
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              {entry.notes}
            </ThemedText>
          ) : null}

          <ButtonRow>
            <AppButton label="Editar" tone="secondary" onPress={() => openEdit(entry)} />
            <AppButton label="Apagar" tone="danger" onPress={() => handleDelete(entry)} />
          </ButtonRow>
        </SectionCard>
      ))}

      <FormModal
        visible={formVisible}
        title={editingId ? 'Editar refeição' : 'Nova refeição'}
        onClose={() => setFormVisible(false)}
        footer={<AppButton label={saving ? 'A guardar...' : 'Guardar refeição'} onPress={() => void handleSave()} disabled={saving} />}>
        <FormField label="Data" value={plannedDate} onChangeText={setPlannedDate} placeholder="YYYY-MM-DD" />
        <SelectField<MealSlot> label="Momento do dia" value={mealSlot} options={mealSlotOptions} onChange={setMealSlot} />
        {recipes.length === 0 ? (
          <ThemedText themeColor="textSecondary">Não existem receitas disponíveis para planear.</ThemedText>
        ) : (
          <SelectField
            label="Receita"
            value={recipeId}
            options={recipes.map((recipe) => ({ label: recipe.name, value: recipe.id }))}
            onChange={(selectedRecipeId) => {
              const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId);

              setRecipeId(selectedRecipeId);
              setServingsNeeded(String(selectedRecipe?.servings ?? 4));
            }}
          />
        )}
        <FormField label="Doses necessárias" value={servingsNeeded} onChangeText={setServingsNeeded} keyboardType="numeric" />

        <FormField label="Notas" value={notes} onChangeText={setNotes} multiline placeholder="Observações, trocas ou lembretes..." />
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
  entryHeader: {
    gap: Spacing.two,
  },
  entryTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
