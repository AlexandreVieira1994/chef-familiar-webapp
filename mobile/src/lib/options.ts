import { MealSlot, RecipeSourceType, RecipeStatus } from '@/lib/types';

export const recipeStatusOptions: { label: string; value: RecipeStatus }[] = [
  { label: 'Por testar', value: 'por_testar' },
  { label: 'Aprovada', value: 'aprovada' },
  { label: 'Neutra', value: 'neutra' },
  { label: 'A melhorar', value: 'a_melhorar' },
  { label: 'Rejeitada', value: 'rejeitada' },
];

export const recipeSourceTypeOptions: { label: string; value: RecipeSourceType }[] = [
  { label: 'Criada', value: 'criada' },
  { label: 'Importada', value: 'importada' },
];

export const recipeCategoryOptions = [
  { label: 'Carne', value: 'Carne' },
  { label: 'Peixe', value: 'Peixe' },
  { label: 'Vegetariano', value: 'Vegetariano' },
  { label: 'Sopa', value: 'Sopa' },
  { label: 'Entrada', value: 'Entrada' },
  { label: 'Sobremesa', value: 'Sobremesa' },
  { label: 'Outro', value: 'Outro' },
];

export const costLevelOptions = [
  { label: 'Económico', value: 'economico' },
  { label: 'Médio', value: 'medio' },
  { label: 'Elevado', value: 'elevado' },
  { label: 'Sem indicação', value: '' },
];

export const unitOptions = [
  { label: 'q.b.', value: 'q.b.' },
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'ml', value: 'ml' },
  { label: 'l', value: 'l' },
  { label: 'un', value: 'un' },
  { label: 'chavena', value: 'chavena' },
  { label: 'c. sopa', value: 'c. sopa' },
  { label: 'c. sobremesa', value: 'c. sobremesa' },
  { label: 'c. café', value: 'c. cafe' },
  { label: 'embalagem', value: 'embalagem' },
  { label: 'molho', value: 'molho' },
  { label: 'ramo', value: 'ramo' },
  { label: 'pacote', value: 'pacote' },
];

export const mealSlotOptions: { label: string; value: MealSlot }[] = [
  { label: 'Pequeno-almoço', value: 'pequeno-almoco' },
  { label: 'Almoço', value: 'almoco' },
  { label: 'Lanche', value: 'lanche' },
  { label: 'Jantar', value: 'jantar' },
];
