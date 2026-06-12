import { MealSlot, RecipeStatus } from '@/lib/types';

export const recipeStatusOptions: { label: string; value: RecipeStatus }[] = [
  { label: 'Por testar', value: 'por_testar' },
  { label: 'Aprovada', value: 'aprovada' },
  { label: 'Neutra', value: 'neutra' },
  { label: 'A melhorar', value: 'a_melhorar' },
  { label: 'Rejeitada', value: 'rejeitada' },
];

export const mealSlotOptions: { label: string; value: MealSlot }[] = [
  { label: 'Pequeno-almoço', value: 'pequeno-almoco' },
  { label: 'Almoço', value: 'almoco' },
  { label: 'Lanche', value: 'lanche' },
  { label: 'Jantar', value: 'jantar' },
];
