import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  ButtonRow,
  ChipSelector,
  FormField,
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
import { formatDateTime, formatQuantity, sanitizeOptionalText } from '@/lib/format';
import { recipeStatusOptions } from '@/lib/options';
import { getRecipe, listRecipeIngredients, upsertRecipe } from '@/lib/services';
import { RecipeIngredient, RecipeStatus, RecipeUpsertInput } from '@/lib/types';

type RecipeDetailData = {
  recipe: Awaited<ReturnType<typeof getRecipe>>;
  ingredients: RecipeIngredient[];
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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
        source_url: currentRecipe.source_url,
      });
    }
  }, [currentRecipe, form]);

  const statusOptions = useMemo(() => recipeStatusOptions, []);

  const handleSave = useCallback(async () => {
    if (!form || !form.id) return;

    if (!form.code.trim() || !form.name.trim() || !form.category.trim() || !form.source_url.trim()) {
      Alert.alert('Campos em falta', 'Preenche código, nome, categoria e source_url.');
      return;
    }

    setSaving(true);

    try {
      await upsertRecipe({
        ...form,
        cost_level: sanitizeOptionalText(form.cost_level ?? ''),
        notes: sanitizeOptionalText(form.notes ?? ''),
        image_url: sanitizeOptionalText(form.image_url ?? ''),
      });

      await recipeDetail.reload();
      Alert.alert('Receita atualizada', 'As alterações foram guardadas.');
    } catch (error) {
      Alert.alert('Erro ao guardar', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }, [form, recipeDetail]);

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
            <FormField label="Custo" value={form.cost_level ?? ''} onChangeText={(cost_level) => setForm((current) => (current ? { ...current, cost_level } : current))} />
            <FormField label="Imagem" value={form.image_url ?? ''} onChangeText={(image_url) => setForm((current) => (current ? { ...current, image_url } : current))} keyboardType="url" />
            <FormField label="Fonte" value={form.source_url} onChangeText={(source_url) => setForm((current) => (current ? { ...current, source_url } : current))} keyboardType="url" />
            <FormField label="Notas" value={form.notes ?? ''} onChangeText={(notes) => setForm((current) => (current ? { ...current, notes } : current))} multiline />
            <ButtonRow>
              <AppButton label={saving ? 'A guardar...' : 'Guardar'} onPress={() => void handleSave()} disabled={saving} />
              <AppButton label="Fonte" tone="secondary" onPress={() => void Linking.openURL(currentRecipe.source_url)} />
            </ButtonRow>
            <ButtonRow>
              <AppButton label="Voltar" tone="secondary" onPress={() => router.back()} />
            </ButtonRow>
          </SectionCard>

          <SectionHeader>Ingredientes</SectionHeader>
          <SectionCard>
            {recipeDetail.data?.ingredients.length ? (
              <InsetGroup>
                {recipeDetail.data.ingredients.map((ingredient) => (
                  <ListRow
                    key={ingredient.id}
                    title={ingredient.ingredient_name}
                    subtitle={formatQuantity(ingredient.quantity, ingredient.unit)}
                    accessory={
                      <View style={styles.tags}>
                        {ingredient.category ? <Tag>{ingredient.category}</Tag> : null}
                        {ingredient.optional ? <Tag>opcional</Tag> : null}
                      </View>
                    }
                  />
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
});
