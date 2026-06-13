import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, ButtonRow, FormField, SelectField } from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { parseOptionalNumber } from '@/lib/format';
import { unitOptions } from '@/lib/options';
import { Ingredient } from '@/lib/types';

export type RecipeStepDraft = {
  id?: string;
  description: string;
};

export type RecipeIngredientDraft = {
  id?: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: string;
  unit: string;
  category: string;
  optional: 'sim' | 'nao';
};

export type RecipeImageSelection = {
  displayUri: string;
  storedValue: string;
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
    id: draft.id,
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

async function imageAssetToSelection(asset: ImagePicker.ImagePickerAsset): Promise<RecipeImageSelection> {
  const result = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1200 } }], {
    base64: true,
    compress: 0.6,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  if (!result.base64) {
    throw new Error('Não foi possível preparar a imagem selecionada.');
  }

  return {
    displayUri: result.uri,
    storedValue: `data:image/jpeg;base64,${result.base64}`,
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
      quality: 0.55,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const image = await imageAssetToSelection(result.assets[0]);
      onChange(image.storedValue);
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
      quality: 0.55,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const image = await imageAssetToSelection(result.assets[0]);
      onChange(image.storedValue);
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

export function RecipeImageOverlayAction({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (image: RecipeImageSelection | null) => void;
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
      quality: 0.55,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      onChange(await imageAssetToSelection(result.assets[0]));
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
      quality: 0.55,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      onChange(await imageAssetToSelection(result.assets[0]));
    }
  }

  function openOptions() {
    if (disabled) return;

    Alert.alert(value ? 'Alterar imagem' : 'Adicionar imagem', undefined, [
      { text: 'Tirar foto', onPress: () => void takePhoto() },
      { text: 'Anexar', onPress: () => void pickFromLibrary() },
      ...(value ? [{ text: 'Remover', style: 'destructive' as const, onPress: () => onChange(null) }] : []),
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  if (disabled) return null;

  return (
    <Pressable onPress={openOptions} style={({ pressed }) => [styles.imageOverlayAction, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={styles.imageOverlayActionText}>
        {value ? 'Alterar imagem' : 'Adicionar imagem'}
      </ThemedText>
    </Pressable>
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
    onChange(steps.map((step, currentIndex) => (currentIndex === index ? { ...step, description } : step)));
  }

  return (
    <View style={styles.group}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Passos
      </ThemedText>
      {steps.map((step, index) => (
        <View key={step.id ?? `step-${index}`} style={styles.stepItem}>
          {!disabled && steps.length > 1 ? (
            <Pressable
              accessibilityLabel="Remover passo"
              onPress={() => onChange(steps.filter((_, currentIndex) => currentIndex !== index))}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.removeButtonText}>
                X
              </ThemedText>
            </Pressable>
          ) : null}
          <FormField
            label={`Passo ${index + 1}`}
            value={step.description}
            onChangeText={(description) => updateStep(index, description)}
            multiline
            autoGrow
            editable={!disabled}
          />
        </View>
      ))}
      {!disabled ? (
        <Pressable onPress={() => onChange([...steps, createEmptyStep()])} style={({ pressed }) => [pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.addText}>
            Adicionar passo
          </ThemedText>
        </Pressable>
      ) : null}
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
        <View key={ingredient.id ?? `ingredient-${index}`} style={styles.ingredientItem}>
          {!disabled && ingredients.length > 1 ? (
            <Pressable
              accessibilityLabel="Remover ingrediente"
              onPress={() => onChange(ingredients.filter((_, currentIndex) => currentIndex !== index))}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.removeButtonText}>
                X
              </ThemedText>
            </Pressable>
          ) : null}
          <View style={styles.ingredientNameField}>
            <SelectField
              label="Ingrediente"
              value={ingredient.ingredient_id}
              options={ingredientOptions}
              onChange={(ingredientId) => selectIngredient(index, ingredientId)}
              enabled={!disabled && ingredientOptions.length > 0}
              compact
            />
          </View>
          <View style={styles.ingredientMetaRow}>
            <View style={styles.ingredientQuantityField}>
              <FormField
                label="Qtd."
                value={ingredient.quantity}
                onChangeText={(quantity) => updateIngredient(index, { ...ingredient, quantity })}
                keyboardType="numeric"
                editable={!disabled}
                compact
              />
            </View>
            <View style={styles.ingredientUnitField}>
              <SelectField
                label="Unidade"
                value={ingredient.unit}
                options={unitOptions.some((option) => option.value === ingredient.unit) ? unitOptions : [...unitOptions, { label: ingredient.unit, value: ingredient.unit }]}
                onChange={(unit) => updateIngredient(index, { ...ingredient, unit })}
                enabled={!disabled}
                compact
              />
            </View>
            <View style={styles.ingredientOptionalField}>
              <SelectField
                label="Opcional"
                value={ingredient.optional}
                options={[
                  { label: 'Não', value: 'nao' },
                  { label: 'Sim', value: 'sim' },
                ]}
                onChange={(optional) => updateIngredient(index, { ...ingredient, optional })}
                enabled={!disabled}
                compact
              />
            </View>
          </View>
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
  imageOverlayAction: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.92)',
  },
  imageOverlayActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
  },
  subField: {
    gap: Spacing.two,
  },
  stepItem: {
    gap: Spacing.two,
    position: 'relative',
    paddingTop: 4,
  },
  ingredientItem: {
    gap: 6,
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(120, 120, 128, 0.10)',
  },
  ingredientNameField: {
    width: '100%',
  },
  ingredientMetaRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
  },
  ingredientQuantityField: {
    width: 72,
  },
  ingredientUnitField: {
    flex: 1,
    minWidth: 88,
  },
  ingredientOptionalField: {
    width: 88,
  },
  removeButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    zIndex: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  removeButtonText: {
    color: '#FF3B30',
    fontSize: 12,
    lineHeight: 14,
  },
  addText: {
    color: '#007AFF',
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
