import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  ButtonRow,
  FormField,
  FormModal,
  InfoState,
  LoadingState,
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
import { RecipeImage } from '@/components/recipe-image';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { parseOptionalNumber, sanitizeOptionalText } from '@/lib/format';
import { costLevelOptions, recipeCategoryOptions, recipeDishTypeOptions, recipeStatusOptions } from '@/lib/options';
import { createRecipeWithDetails, listIngredients, listRecipes } from '@/lib/services';
import { Ingredient, Recipe, RecipeStatus } from '@/lib/types';

type RecipesData = {
  recipes: Recipe[];
  ingredients: Ingredient[];
};

type CreateRecipeForm = {
  name: string;
  category: string;
  dish_type: string;
  status: RecipeStatus;
  cost_level: string;
  servings: string;
  notes: string;
};

function createInternalRecipeCode() {
  return `RF-${Date.now().toString(36).toUpperCase()}`;
}

function createEmptyForm(): CreateRecipeForm {
  return {
    name: '',
    category: recipeCategoryOptions[0].value,
    dish_type: recipeDishTypeOptions[0].value,
    status: 'por_testar',
    cost_level: '',
    servings: '4',
    notes: '',
  };
}

function createInitialIngredients(catalog: Ingredient[]) {
  return catalog.length ? [createEmptyIngredient(catalog)] : [];
}

export default function RecipesScreen() {
  const loadRecipes = useCallback(async () => {
    const [recipes, ingredients] = await Promise.all([listRecipes(), listIngredients()]);

    return { recipes, ingredients };
  }, []);
  const recipes = useAsyncResource<RecipesData>(loadRecipes);
  const router = useRouter();
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateRecipeForm>(createEmptyForm);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [steps, setSteps] = useState<RecipeStepDraft[]>([createEmptyStep()]);
  const [ingredientDrafts, setIngredientDrafts] = useState<RecipeIngredientDraft[]>([]);

  const reload = recipes.reload;
  const catalog = recipes.data?.ingredients ?? [];

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  function openCreate() {
    setForm(createEmptyForm());
    setImageUri(null);
    setSteps([createEmptyStep()]);
    setIngredientDrafts(createInitialIngredients(catalog));
    setFormVisible(true);
  }

  async function handleCreateRecipe() {
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
      const createdRecipe = await createRecipeWithDetails({
        recipe: {
          code: createInternalRecipeCode(),
          name: form.name,
          category: form.category,
          dish_type: form.dish_type,
          status: form.status,
          cost_level: sanitizeOptionalText(form.cost_level),
          notes: sanitizeOptionalText(form.notes),
          servings,
          source_type: 'criada',
          source_url: null,
        },
        steps: validSteps.map((step, index) => ({
          recipe_id: '',
          position: index + 1,
          description: step.description,
        })),
        ingredients: validIngredients.map((ingredient) => ingredientDraftToInput('', ingredient)),
        imageUri,
      });

      setFormVisible(false);
      await recipes.reload();
      router.push(`/recipes/${createdRecipe.id}` as never);
    } catch (error) {
      Alert.alert('Erro ao criar receita', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen refreshing={recipes.refreshing} onRefresh={() => void recipes.reload()}>
      <View style={styles.header}>
        <ThemedText type="title">Receitas</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragraph}>
          Catálogo principal da app, com doses, passos, ingredientes normalizados e ligação às fontes originais.
        </ThemedText>
      </View>

      <ButtonRow>
        <AppButton label="Nova receita" onPress={openCreate} />
      </ButtonRow>

      {recipes.loading ? <LoadingState label="A carregar receitas..." /> : null}

      {recipes.error ? (
        <InfoState
          title="Não foi possível carregar receitas"
          message={recipes.error}
          action={<AppButton label="Tentar novamente" onPress={() => void recipes.reload()} />}
        />
      ) : null}

      {recipes.data && recipes.data.recipes.length === 0 ? (
        <InfoState
          title="Sem receitas"
          message="Ainda não existem receitas visíveis no Supabase. Podes criar a primeira a partir deste ecrã."
        />
      ) : null}

      {recipes.data?.recipes.length ? <SectionHeader>Lista</SectionHeader> : null}
      <View style={styles.recipeList}>
        {recipes.data?.recipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            style={({ pressed }) => [styles.recipeRow, pressed && styles.pressed]}
            onPress={() => router.push(`/recipes/${recipe.id}` as never)}>
            <View style={styles.thumbnailShell}>
              <RecipeImage uri={recipe.image_url} title={recipe.name} subtitle={recipe.category} variant="thumbnail" />
            </View>
            <View style={styles.recipeText}>
              <ThemedText style={styles.recipeTitle}>{recipe.name}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.recipeSubtitle}>
                {recipe.category} · {recipe.dish_type} · {recipe.servings} doses
              </ThemedText>
              <View style={styles.tags}>
                <Tag>{recipe.source_type}</Tag>
                <Tag>{recipe.status}</Tag>
                {recipe.cost_level ? <Tag>{recipe.cost_level}</Tag> : null}
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <FormModal
        visible={formVisible}
        title="Nova receita"
        onClose={() => setFormVisible(false)}
        footer={<AppButton label={saving ? 'A guardar...' : 'Guardar receita'} onPress={() => void handleCreateRecipe()} disabled={saving} />}>
        <FormField label="Nome" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Nome da receita" />
        <SelectField
          label="Categoria alimentar"
          value={form.category}
          options={recipeCategoryOptions}
          onChange={(category) => setForm((current) => ({ ...current, category }))}
        />
        <SelectField
          label="Tipo de prato"
          value={form.dish_type}
          options={recipeDishTypeOptions}
          onChange={(dish_type) => setForm((current) => ({ ...current, dish_type }))}
        />
        <SelectField<RecipeStatus>
          label="Estado"
          value={form.status}
          options={recipeStatusOptions}
          onChange={(status) => setForm((current) => ({ ...current, status }))}
        />
        <SelectField
          label="Custo"
          value={form.cost_level}
          options={costLevelOptions}
          onChange={(cost_level) => setForm((current) => ({ ...current, cost_level }))}
        />
        <FormField label="Doses" value={form.servings} onChangeText={(servings) => setForm((current) => ({ ...current, servings }))} keyboardType="numeric" />
        <RecipeImagePicker value={imageUri} onChange={setImageUri} />
        <StepFields steps={steps} onChange={setSteps} />
        <RecipeIngredientFields ingredients={ingredientDrafts} catalog={catalog} onChange={setIngredientDrafts} />
        <FormField
          label="Notas"
          value={form.notes}
          onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
          placeholder="Observações, adaptações ou lembretes..."
          multiline
        />
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
  recipeList: {
    gap: Spacing.two,
  },
  recipeRow: {
    minHeight: 96,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
  },
  thumbnailShell: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
  },
  recipeText: {
    flex: 1,
    gap: 4,
  },
  recipeTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  recipeSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
