import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, ButtonRow, FormField, SelectField, Tag } from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { parseOptionalNumber } from '@/lib/format';
import { unitOptions } from '@/lib/options';
import { Ingredient } from '@/lib/types';

export type RecipeStepDraft = {
  description: string;
};

export type RecipeIngredientDraft = {
  ingredient_id: string;
  ingredient_name: string;
  quantity: string;
  unit: string;
  category: string;
  optional: 'sim' | 'nao';
};

export function createEmptyStep(): RecipeStepDraft {
  return { description: '' };
}

export function createEmptyIngredient(ingredients: Ingredient[]): RecipeIngredientDraft {
  const [firstIngredient] = ingredients;

  return {
    ingredient_id: firstIngredient?.id ?? '',
    ingredient_name: firstIngredient?.name ?? '',
    quantity: '',
    unit: firstIngredient?.default_unit ?? 'un',
    category: firstIngredient?.category ?? '',
    optional: 'nao',
  };
}

export function ingredientDraftToInput(recipeId: string, draft: RecipeIngredientDraft) {
  return {
    recipe_id: recipeId,
    ingredient_id: draft.ingredient_id || null,
    ingredient_name: draft.ingredient_name,
    quantity: parseOptionalNumber(draft.quantity),
    unit: draft.unit || null,
    category: draft.category || null,
    optional: draft.optional === 'sim',
    image_url: null,
  };
}

export function RecipeImagePicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (uri: string | null) => void;
  disabled?: boolean;
}) {
  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autoriza o acesso às fotos para anexar uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autoriza o acesso à câmara para tirar uma foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  }

  return (
    <View style={styles.group}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Imagem
      </ThemedText>
      <View style={styles.imagePreview}>
        {value ? (
          <Image source={{ uri: value }} style={styles.previewImage} contentFit="cover" />
        ) : (
          <ThemedText themeColor="textSecondary">Sem imagem selecionada.</ThemedText>
        )}
      </View>
      {!disabled ? (
        <ButtonRow>
          <AppButton label="Tirar foto" tone="secondary" onPress={() => void takePhoto()} />
          <AppButton label="Anexar" tone="secondary" onPress={() => void pickFromLibrary()} />
          {value ? <AppButton label="Remover" tone="danger" onPress={() => onChange(null)} /> : null}
        </ButtonRow>
      ) : null}
    </View>
  );
}

export function StepFields({
  steps,
  onChange,
  disabled,
}: {
  steps: RecipeStepDraft[];
  onChange: (steps: RecipeStepDraft[]) => void;
  disabled?: boolean;
}) {
  function updateStep(index: number, description: string) {
    onChange(steps.map((step, currentIndex) => (currentIndex === index ? { description } : step)));
  }

  return (
    <View style={styles.group}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Passos
      </ThemedText>
      {steps.map((step, index) => (
        <View key={`step-${index}`} style={styles.subField}>
          <FormField
            label={`Passo ${index + 1}`}
            value={step.description}
            onChangeText={(description) => updateStep(index, description)}
            multiline
            editable={!disabled}
          />
          {!disabled && steps.length > 1 ? (
            <AppButton
              label="Remover passo"
              tone="danger"
              onPress={() => onChange(steps.filter((_, currentIndex) => currentIndex !== index))}
            />
          ) : null}
        </View>
      ))}
      {!disabled ? <AppButton label="Adicionar passo" tone="secondary" onPress={() => onChange([...steps, createEmptyStep()])} /> : null}
    </View>
  );
}

export function RecipeIngredientFields({
  ingredients,
  catalog,
  onChange,
  disabled,
}: {
  ingredients: RecipeIngredientDraft[];
  catalog: Ingredient[];
  onChange: (ingredients: RecipeIngredientDraft[]) => void;
  disabled?: boolean;
}) {
  const ingredientOptions = catalog.map((ingredient) => ({ label: ingredient.name, value: ingredient.id }));

  function updateIngredient(index: number, next: RecipeIngredientDraft) {
    onChange(ingredients.map((ingredient, currentIndex) => (currentIndex === index ? next : ingredient)));
  }

  function selectIngredient(index: number, ingredientId: string) {
    const selected = catalog.find((ingredient) => ingredient.id === ingredientId);
    const current = ingredients[index];

    if (!current || !selected) return;

    updateIngredient(index, {
      ...current,
      ingredient_id: selected.id,
      ingredient_name: selected.name,
      unit: selected.default_unit ?? current.unit,
      category: selected.category ?? current.category,
    });
  }

  return (
    <View style={styles.group}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Ingredientes
      </ThemedText>
      {catalog.length === 0 ? (
        <ThemedText themeColor="textSecondary">Ainda não existe catálogo de ingredientes.</ThemedText>
      ) : null}
      {ingredients.map((ingredient, index) => (
        <View key={`ingredient-${index}`} style={styles.ingredientBox}>
          <View style={styles.rowHeader}>
            <Tag>{index + 1}</Tag>
            {ingredient.optional === 'sim' ? <Tag>opcional</Tag> : null}
          </View>
          <SelectField
            label="Ingrediente"
            value={ingredient.ingredient_id}
            options={ingredientOptions}
            onChange={(ingredientId) => selectIngredient(index, ingredientId)}
            enabled={!disabled && ingredientOptions.length > 0}
          />
          <FormField
            label="Quantidade"
            value={ingredient.quantity}
            onChangeText={(quantity) => updateIngredient(index, { ...ingredient, quantity })}
            keyboardType="numeric"
            editable={!disabled}
          />
          <SelectField
            label="Unidade"
            value={ingredient.unit}
            options={unitOptions.some((option) => option.value === ingredient.unit) ? unitOptions : [...unitOptions, { label: ingredient.unit, value: ingredient.unit }]}
            onChange={(unit) => updateIngredient(index, { ...ingredient, unit })}
            enabled={!disabled}
          />
          <SelectField
            label="Opcional"
            value={ingredient.optional}
            options={[
              { label: 'Não', value: 'nao' },
              { label: 'Sim', value: 'sim' },
            ]}
            onChange={(optional) => updateIngredient(index, { ...ingredient, optional })}
            enabled={!disabled}
          />
          {!disabled && ingredients.length > 1 ? (
            <AppButton
              label="Remover ingrediente"
              tone="danger"
              onPress={() => onChange(ingredients.filter((_, currentIndex) => currentIndex !== index))}
            />
          ) : null}
        </View>
      ))}
      {!disabled && catalog.length > 0 ? (
        <Pressable onPress={() => onChange([...ingredients, createEmptyIngredient(catalog)])} style={({ pressed }) => [pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.addText}>
            Adicionar ingrediente
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  imagePreview: {
    minHeight: 160,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
  },
  previewImage: {
    width: '100%',
    height: 190,
  },
  subField: {
    gap: Spacing.two,
  },
  ingredientBox: {
    gap: Spacing.two,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(120, 120, 128, 0.10)',
  },
  rowHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  addText: {
    color: '#007AFF',
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
