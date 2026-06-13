import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  ButtonRow,
  ChipSelector,
  FormField,
  FormModal,
  InfoState,
  InsetGroup,
  ListRow,
  LabeledValue,
  LoadingState,
  SectionCard,
  SectionHeader,
  Tag,
} from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { formatDateTime, formatQuantity, parseOptionalNumber, sanitizeOptionalText } from '@/lib/format';
import { recipeSourceTypeOptions, recipeStatusOptions } from '@/lib/options';
import {
  deleteRecipeIngredient,
  getRecipe,
  listRecipeIngredients,
  upsertRecipe,
  upsertRecipeIngredient,
} from '@/lib/services';
import { RecipeIngredient, RecipeIngredientInput, RecipeSourceType, RecipeStatus, RecipeUpsertInput } from '@/lib/types';

type RecipeDetailData = {
  recipe: Awaited<ReturnType<typeof getRecipe>>;
  ingredients: RecipeIngredient[];
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [ingredientSaving, setIngredientSaving] = useState(false);
  const [ingredientFormVisible, setIngredientFormVisible] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    ingredient_name: '',
    quantity: '',
    unit: '',
    category: '',
    optional: 'nao' as 'sim' | 'nao',
    image_url: '',
  });

  const loadRecipeDetail = useCallback(async () => {
    const recipe = await getRecipe(id);

    if (!recipe) {
      throw new Error('Receita não encontrada.');
    }

    const ingredients = await listRecipeIngredients(recipe.id);

    return { recipe, ingredients };
  }, [id]);
  const recipeDetail = useAsyncResource<RecipeDetailData>(loadRecipeDetail);

  const [form, setForm] = useState<RecipeUpsertInput | null>(null);

  const currentRecipe = recipeDetail.data?.recipe ?? null;

  useEffect(() => {
    if (currentRecipe && !form) {
      setForm({
        id: currentRecipe.id,
        code: currentRecipe.code,
        name: currentRecipe.name,
        category: currentRecipe.category,
        status: currentRecipe.status,
        prep_time_min: currentRecipe.prep_time_min,
        cook_time_min: currentRecipe.cook_time_min,
        cost_level: currentRecipe.cost_level,
        notes: currentRecipe.notes,
        image_url: currentRecipe.image_url,
        source_type: currentRecipe.source_type,
        source_url: currentRecipe.source_url,
      });
    }
  }, [currentRecipe, form]);

  const statusOptions = useMemo(() => recipeStatusOptions, []);

  const handleSave = useCallback(async () => {
    if (!form || !form.id) return;

    if (!form.code.trim() || !form.name.trim() || !form.category.trim()) {
      Alert.alert('Campos em falta', 'Preenche código, nome e categoria.');
      return;
    }

    if (form.source_type === 'importada' && !form.source_url?.trim()) {
      Alert.alert('Fonte em falta', 'Receitas importadas precisam de um URL de origem.');
      return;
    }

    setSaving(true);

    try {
      await upsertRecipe({
        ...form,
        cost_level: sanitizeOptionalText(form.cost_level ?? ''),
        notes: sanitizeOptionalText(form.notes ?? ''),
        image_url: sanitizeOptionalText(form.image_url ?? ''),
        source_type: form.source_type ?? 'manual',
        source_url: sanitizeOptionalText(form.source_url ?? ''),
      });

      setForm(null);
      await recipeDetail.reload();
      Alert.alert('Receita atualizada', 'As alterações foram guardadas.');
    } catch (error) {
      Alert.alert('Erro ao guardar', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }, [form, recipeDetail]);

  function openCreateIngredient() {
    setEditingIngredientId(null);
    setIngredientForm({
      ingredient_name: '',
      quantity: '',
      unit: '',
      category: '',
      optional: 'nao',
      image_url: '',
    });
    setIngredientFormVisible(true);
  }

  function openEditIngredient(ingredient: RecipeIngredient) {
    setEditingIngredientId(ingredient.id);
    setIngredientForm({
      ingredient_name: ingredient.ingredient_name,
      quantity: ingredient.quantity === null ? '' : String(ingredient.quantity),
      unit: ingredient.unit ?? '',
      category: ingredient.category ?? '',
      optional: ingredient.optional ? 'sim' : 'nao',
      image_url: ingredient.image_url ?? '',
    });
    setIngredientFormVisible(true);
  }

  async function handleSaveIngredient() {
    if (!currentRecipe) return;

    if (!ingredientForm.ingredient_name.trim()) {
      Alert.alert('Ingrediente em falta', 'Indica o nome do ingrediente.');
      return;
    }

    const quantity = parseOptionalNumber(ingredientForm.quantity);

    if (ingredientForm.quantity.trim() && quantity === null) {
      Alert.alert('Quantidade inválida', 'A quantidade tem de ser numérica.');
      return;
    }

    setIngredientSaving(true);

    try {
      const input: RecipeIngredientInput = {
        id: editingIngredientId ?? undefined,
        recipe_id: currentRecipe.id,
        ingredient_name: ingredientForm.ingredient_name,
        quantity,
        unit: sanitizeOptionalText(ingredientForm.unit),
        category: sanitizeOptionalText(ingredientForm.category),
        optional: ingredientForm.optional === 'sim',
        image_url: sanitizeOptionalText(ingredientForm.image_url),
      };

      await upsertRecipeIngredient(input);
      setIngredientFormVisible(false);
      await recipeDetail.reload();
    } catch (error) {
      Alert.alert('Erro ao guardar ingrediente', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setIngredientSaving(false);
    }
  }

  function handleDeleteIngredient(ingredient: RecipeIngredient) {
    Alert.alert('Apagar ingrediente', `Queres apagar ${ingredient.ingredient_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipeIngredient(ingredient.id);
            await recipeDetail.reload();
          } catch (error) {
            Alert.alert('Erro ao apagar ingrediente', error instanceof Error ? error.message : 'Tenta novamente.');
          }
        },
      },
    ]);
  }

  return (
    <AppScreen refreshing={recipeDetail.refreshing} onRefresh={() => void recipeDetail.reload()}>
      {recipeDetail.loading ? <LoadingState label="A carregar detalhe da receita..." /> : null}

      {recipeDetail.error ? (
        <InfoState
          title="Não foi possível carregar a receita"
          message={recipeDetail.error}
          action={<AppButton label="Tentar novamente" onPress={() => void recipeDetail.reload()} />}
        />
      ) : null}

      {currentRecipe && form ? (
        <>
          <SectionHeader>Resumo</SectionHeader>
          <SectionCard>
            <View style={styles.header}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {currentRecipe.code}
              </ThemedText>
              <ThemedText type="title" style={styles.title}>
                {currentRecipe.name}
              </ThemedText>
              <View style={styles.tags}>
                <Tag>{currentRecipe.category}</Tag>
                <Tag>{currentRecipe.status}</Tag>
                <Tag>{currentRecipe.source_type}</Tag>
                {currentRecipe.cost_level ? <Tag>{currentRecipe.cost_level}</Tag> : null}
              </View>
            </View>
          </SectionCard>

          <SectionHeader>Editar</SectionHeader>
          <SectionCard>
            <FormField label="Código" value={form.code} onChangeText={(code) => setForm((current) => (current ? { ...current, code } : current))} />
            <FormField label="Nome" value={form.name} onChangeText={(name) => setForm((current) => (current ? { ...current, name } : current))} />
            <FormField label="Categoria" value={form.category} onChangeText={(category) => setForm((current) => (current ? { ...current, category } : current))} />
            <ChipSelector<RecipeStatus>
              label="Estado"
              value={form.status}
              options={statusOptions}
              onChange={(status) => setForm((current) => (current ? { ...current, status } : current))}
            />
            <ChipSelector<RecipeSourceType>
              label="Origem"
              value={form.source_type ?? 'manual'}
              options={recipeSourceTypeOptions}
              onChange={(source_type) => setForm((current) => (current ? { ...current, source_type } : current))}
            />
            <FormField label="Custo" value={form.cost_level ?? ''} onChangeText={(cost_level) => setForm((current) => (current ? { ...current, cost_level } : current))} />
            <FormField label="Imagem" value={form.image_url ?? ''} onChangeText={(image_url) => setForm((current) => (current ? { ...current, image_url } : current))} keyboardType="url" />
            <FormField label="Fonte" value={form.source_url ?? ''} onChangeText={(source_url) => setForm((current) => (current ? { ...current, source_url } : current))} keyboardType="url" />
            <FormField label="Notas" value={form.notes ?? ''} onChangeText={(notes) => setForm((current) => (current ? { ...current, notes } : current))} multiline />
            <ButtonRow>
              <AppButton label={saving ? 'A guardar...' : 'Guardar'} onPress={() => void handleSave()} disabled={saving} />
              {currentRecipe.source_url ? (
                <AppButton label="Fonte" tone="secondary" onPress={() => void Linking.openURL(currentRecipe.source_url!)} />
              ) : null}
            </ButtonRow>
            <ButtonRow>
              <AppButton label="Voltar" tone="secondary" onPress={() => router.back()} />
            </ButtonRow>
          </SectionCard>

          <SectionHeader>Ingredientes</SectionHeader>
          <SectionCard>
            <ButtonRow>
              <AppButton label="Novo ingrediente" onPress={openCreateIngredient} />
            </ButtonRow>
            {recipeDetail.data?.ingredients.length ? (
              <InsetGroup>
                {recipeDetail.data.ingredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientBlock}>
                    <ListRow
                      title={ingredient.ingredient_name}
                      subtitle={formatQuantity(ingredient.quantity, ingredient.unit)}
                      accessory={
                        <View style={styles.tags}>
                          {ingredient.category ? <Tag>{ingredient.category}</Tag> : null}
                          {ingredient.optional ? <Tag>opcional</Tag> : null}
                        </View>
                      }
                    />
                    <ButtonRow>
                      <AppButton label="Editar" tone="secondary" onPress={() => openEditIngredient(ingredient)} />
                      <AppButton label="Apagar" tone="danger" onPress={() => handleDeleteIngredient(ingredient)} />
                    </ButtonRow>
                  </View>
                ))}
              </InsetGroup>
            ) : (
              <ThemedText themeColor="textSecondary">Esta receita ainda não tem ingredientes associados.</ThemedText>
            )}
          </SectionCard>

          <SectionHeader>Histórico</SectionHeader>
          <SectionCard>
            <LabeledValue label="Criada" value={formatDateTime(currentRecipe.created_at)} />
            <LabeledValue label="Último feedback" value={formatDateTime(currentRecipe.last_feedback_at)} />
            <LabeledValue label="Notas de feedback" value={currentRecipe.feedback_notes || 'Sem feedback.'} />
          </SectionCard>
        </>
      ) : null}

      <FormModal
        visible={ingredientFormVisible}
        title={editingIngredientId ? 'Editar ingrediente' : 'Novo ingrediente'}
        onClose={() => setIngredientFormVisible(false)}
        footer={
          <AppButton
            label={ingredientSaving ? 'A guardar...' : 'Guardar ingrediente'}
            onPress={() => void handleSaveIngredient()}
            disabled={ingredientSaving}
          />
        }>
        <FormField label="Ingrediente" value={ingredientForm.ingredient_name} onChangeText={(ingredient_name) => setIngredientForm((current) => ({ ...current, ingredient_name }))} />
        <FormField label="Quantidade" value={ingredientForm.quantity} onChangeText={(quantity) => setIngredientForm((current) => ({ ...current, quantity }))} keyboardType="numeric" />
        <FormField label="Unidade" value={ingredientForm.unit} onChangeText={(unit) => setIngredientForm((current) => ({ ...current, unit }))} placeholder="g, kg, un..." />
        <FormField label="Categoria" value={ingredientForm.category} onChangeText={(category) => setIngredientForm((current) => ({ ...current, category }))} />
        <ChipSelector<'sim' | 'nao'>
          label="Opcional"
          value={ingredientForm.optional}
          options={[
            { label: 'Não', value: 'nao' },
            { label: 'Sim', value: 'sim' },
          ]}
          onChange={(optional) => setIngredientForm((current) => ({ ...current, optional }))}
        />
        <FormField label="Imagem" value={ingredientForm.image_url} onChangeText={(image_url) => setIngredientForm((current) => ({ ...current, image_url }))} keyboardType="url" />
      </FormModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  ingredientBlock: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
