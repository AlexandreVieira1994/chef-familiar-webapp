import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  ButtonRow,
  FormField,
  InfoState,
  LabeledValue,
  LoadingState,
  SectionCard,
  SectionHeader,
  SelectField,
  Tag,
} from '@/components/app-ui';
import {
  createEmptyIngredient,
  createEmptyStep,
  ingredientDraftToInput,
  RecipeImagePicker,
  RecipeIngredientDraft,
  RecipeIngredientFields,
  RecipeStepDraft,
  StepFields,
} from '@/components/recipe-form-fields';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { formatDateTime, formatQuantity, parseOptionalNumber, sanitizeOptionalText } from '@/lib/format';
import { costLevelOptions, recipeCategoryOptions, recipeDishTypeOptions, recipeStatusOptions, unitOptions } from '@/lib/options';
import {
  getRecipe,
  listIngredients,
  listRecipeIngredients,
  listRecipeSteps,
  replaceRecipeIngredients,
  replaceRecipeSteps,
  uploadRecipeImage,
  upsertRecipe,
} from '@/lib/services';
import { Ingredient, Recipe, RecipeIngredient, RecipeStatus, RecipeStep } from '@/lib/types';

type RecipeDetailData = {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  catalog: Ingredient[];
};

type EditRecipeForm = {
  name: string;
  category: string;
  dish_type: string;
  status: RecipeStatus;
  cost_level: string;
  servings: string;
  notes: string;
  image_url: string | null;
};

function createEditForm(recipe: Recipe): EditRecipeForm {
  return {
    name: recipe.name,
    category: recipe.category,
    dish_type: recipe.dish_type,
    status: recipe.status,
    cost_level: recipe.cost_level ?? '',
    servings: String(recipe.servings),
    notes: recipe.notes ?? '',
    image_url: recipe.image_url,
  };
}

function stepDraftsFromSteps(steps: RecipeStep[]) {
  return steps.length ? steps.map((step) => ({ description: step.description })) : [createEmptyStep()];
}

function ingredientDraftsFromIngredients(ingredients: RecipeIngredient[], catalog: Ingredient[]) {
  if (ingredients.length === 0) {
    return catalog.length ? [createEmptyIngredient(catalog)] : [];
  }

  return ingredients.map<RecipeIngredientDraft>((ingredient) => {
    const matched = ingredient.ingredient_id
      ? catalog.find((catalogIngredient) => catalogIngredient.id === ingredient.ingredient_id)
      : catalog.find((catalogIngredient) => catalogIngredient.name === ingredient.ingredient_name);
    const unit = ingredient.unit ?? matched?.default_unit ?? 'q.b.';

    return {
      ingredient_id: matched?.id ?? '',
      ingredient_name: matched?.name ?? ingredient.ingredient_name,
      quantity: ingredient.quantity === null ? '' : String(ingredient.quantity),
      unit: unitOptions.some((option) => option.value === unit) ? unit : unit,
      category: ingredient.category ?? matched?.category ?? '',
      optional: ingredient.optional ? 'sim' : 'nao',
    };
  });
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditRecipeForm | null>(null);
  const [steps, setSteps] = useState<RecipeStepDraft[]>([createEmptyStep()]);
  const [ingredientDrafts, setIngredientDrafts] = useState<RecipeIngredientDraft[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const loadRecipeDetail = useCallback(async () => {
    const recipe = await getRecipe(id);

    if (!recipe) {
      throw new Error('Receita não encontrada.');
    }

    const [ingredients, recipeSteps, catalog] = await Promise.all([
      listRecipeIngredients(recipe.id),
      listRecipeSteps(recipe.id),
      listIngredients(),
    ]);

    return { recipe, ingredients, steps: recipeSteps, catalog };
  }, [id]);
  const recipeDetail = useAsyncResource<RecipeDetailData>(loadRecipeDetail);

  const currentRecipe = recipeDetail.data?.recipe ?? null;
  const isImported = currentRecipe?.source_type === 'importada';
  const catalog = useMemo(() => recipeDetail.data?.catalog ?? [], [recipeDetail.data?.catalog]);

  useEffect(() => {
    if (!recipeDetail.data) return;

    setForm(createEditForm(recipeDetail.data.recipe));
    setSteps(stepDraftsFromSteps(recipeDetail.data.steps));
    setIngredientDrafts(ingredientDraftsFromIngredients(recipeDetail.data.ingredients, recipeDetail.data.catalog));
    setImageUri(recipeDetail.data.recipe.image_url);
  }, [recipeDetail.data]);

  async function handleSave() {
    if (!currentRecipe || !form || isImported) return;

    const servings = parseOptionalNumber(form.servings);
    const validSteps = steps.filter((step) => step.description.trim().length > 0);
    const validIngredients = ingredientDrafts.filter((ingredient) => ingredient.ingredient_id && ingredient.ingredient_name.trim());

    if (!form.name.trim()) {
      Alert.alert('Nome em falta', 'Preenche o nome da receita.');
      return;
    }

    if (!servings || servings <= 0) {
      Alert.alert('Doses inválidas', 'Indica um número de doses maior que zero.');
      return;
    }

    if (validSteps.length === 0) {
      Alert.alert('Passos em falta', 'Adiciona pelo menos um passo à receita.');
      return;
    }

    if (validIngredients.length === 0) {
      Alert.alert('Ingredientes em falta', 'Escolhe pelo menos um ingrediente do catálogo.');
      return;
    }

    if (validIngredients.some((ingredient) => ingredient.quantity.trim() && parseOptionalNumber(ingredient.quantity) === null)) {
      Alert.alert('Quantidade inválida', 'As quantidades dos ingredientes têm de ser numéricas.');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = form.image_url;

      if (imageUri && imageUri !== currentRecipe.image_url) {
        const uploaded = await uploadRecipeImage(imageUri);
        imageUrl = uploaded.publicUrl;
      }

      await upsertRecipe({
        id: currentRecipe.id,
        code: currentRecipe.code,
        name: form.name,
        category: form.category,
        dish_type: form.dish_type,
        status: form.status,
        prep_time_min: currentRecipe.prep_time_min,
        cook_time_min: currentRecipe.cook_time_min,
        cost_level: sanitizeOptionalText(form.cost_level),
        notes: sanitizeOptionalText(form.notes),
        servings,
        image_url: imageUrl,
        source_type: 'criada',
        source_url: null,
      });
      await replaceRecipeSteps(
        currentRecipe.id,
        validSteps.map((step, index) => ({
          recipe_id: currentRecipe.id,
          position: index + 1,
          description: step.description,
        })),
      );
      await replaceRecipeIngredients(
        currentRecipe.id,
        validIngredients.map((ingredient) => ingredientDraftToInput(currentRecipe.id, ingredient)),
      );

      await recipeDetail.reload();
      Alert.alert('Receita atualizada', 'As alterações foram guardadas.');
    } catch (error) {
      Alert.alert('Erro ao guardar', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setSaving(false);
    }
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
              {currentRecipe.image_url ? <Image source={{ uri: currentRecipe.image_url }} style={styles.heroImage} contentFit="cover" /> : null}
              <ThemedText type="title" style={styles.title}>
                {currentRecipe.name}
              </ThemedText>
              <View style={styles.tags}>
                <Tag>{currentRecipe.category}</Tag>
                <Tag>{currentRecipe.dish_type}</Tag>
                <Tag>{currentRecipe.status}</Tag>
                <Tag>{currentRecipe.source_type}</Tag>
                <Tag>{currentRecipe.servings} doses</Tag>
                {currentRecipe.cost_level ? <Tag>{currentRecipe.cost_level}</Tag> : null}
              </View>
              {currentRecipe.source_url ? (
                <Pressable onPress={() => void Linking.openURL(currentRecipe.source_url!)} style={({ pressed }) => [pressed && styles.pressed]}>
                  <ThemedText selectable style={styles.sourceLink}>
                    {currentRecipe.source_url}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </SectionCard>

          <SectionHeader>{isImported ? 'Dados' : 'Editar'}</SectionHeader>
          <SectionCard>
            {isImported ? (
              <ThemedText themeColor="textSecondary" style={styles.paragraph}>
                Receita importada. Os dados, doses, passos e ingredientes são fixos.
              </ThemedText>
            ) : null}
            <FormField label="Nome" value={form.name} onChangeText={(name) => setForm((current) => (current ? { ...current, name } : current))} editable={!isImported} />
            <SelectField
              label="Categoria alimentar"
              value={form.category}
              options={recipeCategoryOptions.some((option) => option.value === form.category) ? recipeCategoryOptions : [...recipeCategoryOptions, { label: form.category, value: form.category }]}
              onChange={(category) => setForm((current) => (current ? { ...current, category } : current))}
              enabled={!isImported}
            />
            <SelectField
              label="Tipo de prato"
              value={form.dish_type}
              options={recipeDishTypeOptions.some((option) => option.value === form.dish_type) ? recipeDishTypeOptions : [...recipeDishTypeOptions, { label: form.dish_type, value: form.dish_type }]}
              onChange={(dish_type) => setForm((current) => (current ? { ...current, dish_type } : current))}
              enabled={!isImported}
            />
            <SelectField<RecipeStatus>
              label="Estado"
              value={form.status}
              options={recipeStatusOptions}
              onChange={(status) => setForm((current) => (current ? { ...current, status } : current))}
              enabled={!isImported}
            />
            <SelectField
              label="Custo"
              value={form.cost_level}
              options={costLevelOptions}
              onChange={(cost_level) => setForm((current) => (current ? { ...current, cost_level } : current))}
              enabled={!isImported}
            />
            <FormField label="Doses" value={form.servings} onChangeText={(servings) => setForm((current) => (current ? { ...current, servings } : current))} keyboardType="numeric" editable={!isImported} />
            {!isImported ? <RecipeImagePicker value={imageUri} onChange={setImageUri} /> : null}
            <StepFields steps={steps} onChange={setSteps} disabled={isImported} />
            <RecipeIngredientFields ingredients={ingredientDrafts} catalog={catalog} onChange={setIngredientDrafts} disabled={isImported} />
            <FormField
              label="Notas"
              value={form.notes}
              onChangeText={(notes) => setForm((current) => (current ? { ...current, notes } : current))}
              multiline
              editable={!isImported}
            />
            {!isImported ? (
              <ButtonRow>
                <AppButton label={saving ? 'A guardar...' : 'Guardar'} onPress={() => void handleSave()} disabled={saving} />
              </ButtonRow>
            ) : null}
          </SectionCard>

          <SectionHeader>Ingredientes atuais</SectionHeader>
          <SectionCard>
            {recipeDetail.data?.ingredients.length ? (
              recipeDetail.data.ingredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientRow}>
                  <ThemedText>{ingredient.ingredient_name}</ThemedText>
                  <ThemedText themeColor="textSecondary">{formatQuantity(ingredient.quantity, ingredient.unit)}</ThemedText>
                </View>
              ))
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
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sourceLink: {
    color: '#007AFF',
    lineHeight: 21,
  },
  paragraph: {
    lineHeight: 21,
  },
  ingredientRow: {
    gap: 2,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
