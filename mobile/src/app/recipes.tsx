import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  ChipSelector,
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
import { recipeStatusOptions } from '@/lib/options';
import { sanitizeOptionalText } from '@/lib/format';
import { listRecipes, upsertRecipe } from '@/lib/services';
import { RecipeStatus, RecipeUpsertInput } from '@/lib/types';

function createEmptyForm(): RecipeUpsertInput {
  return {
    code: '',
    name: '',
    category: '',
    status: 'por_testar',
    prep_time_min: null,
    cook_time_min: null,
    cost_level: '',
    notes: '',
    image_url: '',
    source_url: '',
  };
}

export default function RecipesScreen() {
  const loadRecipes = useCallback(() => listRecipes(), []);
  const recipes = useAsyncResource(loadRecipes);
  const router = useRouter();
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RecipeUpsertInput>(createEmptyForm);

  const reload = recipes.reload;

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const sortedStatuses = useMemo(() => recipeStatusOptions, []);

  async function handleCreateRecipe() {
    if (!form.code.trim() || !form.name.trim() || !form.category.trim() || !form.source_url.trim()) {
      Alert.alert('Campos em falta', 'Preenche pelo menos código, nome, categoria e source_url.');
      return;
    }

    setSaving(true);

    try {
      await upsertRecipe({
        ...form,
        cost_level: sanitizeOptionalText(form.cost_level ?? ''),
        notes: sanitizeOptionalText(form.notes ?? ''),
        image_url: sanitizeOptionalText(form.image_url ?? ''),
        source_url: form.source_url.trim(),
      });

      setFormVisible(false);
      setForm(createEmptyForm());
      await recipes.reload();
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
          Lista real de receitas com navegação para detalhe, edição e leitura de ingredientes.
        </ThemedText>
      </View>

      <AppButton
        label="Nova receita"
        onPress={() => {
          setForm(createEmptyForm());
          setFormVisible(true);
        }}
      />

      {recipes.loading ? <LoadingState label="A carregar receitas..." /> : null}

      {recipes.error ? (
        <InfoState
          title="Não foi possível carregar receitas"
          message={recipes.error}
          action={<AppButton label="Tentar novamente" onPress={() => void recipes.reload()} />}
        />
      ) : null}

      {recipes.data && recipes.data.length === 0 ? (
        <InfoState
          title="Sem receitas"
          message="Ainda não existem receitas visíveis no Supabase. Podes criar a primeira a partir deste ecrã."
        />
      ) : null}

      {recipes.data?.map((recipe) => (
        <Pressable key={recipe.id} style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]} onPress={() => router.push(`/recipes/${recipe.id}` as never)}>
          <SectionCard>
            <View style={styles.recipeHeader}>
              <View style={styles.recipeHeaderText}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {recipe.code}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.recipeTitle}>
                  {recipe.name}
                </ThemedText>
              </View>
              <Tag>{recipe.status}</Tag>
            </View>

            <View style={styles.metaRow}>
              <Tag>{recipe.category}</Tag>
              {recipe.cost_level ? <Tag>{recipe.cost_level}</Tag> : null}
              {recipe.source_url ? <Tag>fonte</Tag> : null}
            </View>

            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              {recipe.notes?.slice(0, 160) || 'Sem notas ainda.'}
            </ThemedText>
          </SectionCard>
        </Pressable>
      ))}

      <FormModal
        visible={formVisible}
        title="Nova receita"
        onClose={() => setFormVisible(false)}
        footer={<AppButton label={saving ? 'A guardar...' : 'Guardar receita'} onPress={() => void handleCreateRecipe()} disabled={saving} />}>
        <FormField label="Código" value={form.code} onChangeText={(code) => setForm((current) => ({ ...current, code }))} placeholder="RF011" />
        <FormField label="Nome" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Nome da receita" />
        <FormField label="Categoria" value={form.category} onChangeText={(category) => setForm((current) => ({ ...current, category }))} placeholder="Vegetariano, Sopa, Peixe..." />
        <ChipSelector<RecipeStatus>
          label="Estado"
          value={form.status}
          options={sortedStatuses}
          onChange={(status) => setForm((current) => ({ ...current, status }))}
        />
        <FormField label="Custo" value={form.cost_level ?? ''} onChangeText={(cost_level) => setForm((current) => ({ ...current, cost_level }))} placeholder="economico, medio..." />
        <FormField label="Imagem" value={form.image_url ?? ''} onChangeText={(image_url) => setForm((current) => ({ ...current, image_url }))} placeholder="https://..." keyboardType="url" />
        <FormField label="Fonte" value={form.source_url} onChangeText={(source_url) => setForm((current) => ({ ...current, source_url }))} placeholder="https://..." keyboardType="url" />
        <FormField label="Notas" value={form.notes ?? ''} onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} placeholder="Passos, observações, adaptações..." multiline />
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
  cardPressable: {
    borderRadius: Spacing.four,
  },
  recipeHeader: {
    gap: Spacing.two,
  },
  recipeHeaderText: {
    gap: 4,
  },
  recipeTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.72,
  },
});
