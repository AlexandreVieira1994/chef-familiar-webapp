import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  InfoState,
  InsetGroup,
  ListRow,
  LoadingState,
  SectionCard,
  SectionHeader,
} from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { IOSColors } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { formatDate, formatQuantity } from '@/lib/format';
import { getDashboardSummary } from '@/lib/services';

const primaryActions = [
  {
    title: 'Inventário',
    description: 'Lotes, validades e stock disponível',
    href: '/inventory',
    statKey: 'inventoryActiveCount',
  },
  {
    title: 'Receitas',
    description: 'Receitas, estados e notas',
    href: '/recipes',
    statKey: 'recipesCount',
  },
  {
    title: 'Plano semanal',
    description: 'Refeições por data e momento do dia',
    href: '/planner',
    statKey: null,
  },
  {
    title: 'Compras',
    description: 'Lista ativa e itens por comprar',
    href: '/shopping',
    statKey: 'shoppingPendingCount',
  },
  {
    title: 'Regras familiares',
    description: 'Preferências e limites da família',
    href: '/rules',
    statKey: 'rulesCount',
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const loadSummary = useCallback(() => getDashboardSummary(), []);
  const summary = useAsyncResource(loadSummary);
  const reload = summary.reload;

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <AppScreen refreshing={summary.refreshing} onRefresh={() => void reload()}>
      <View style={styles.header}>
        <ThemedText type="title">Chef Familiar</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.lead}>
          Tudo o que precisas para gerir receitas, inventário, compras e planeamento num único fluxo iPhone-first.
        </ThemedText>
      </View>

      {summary.loading ? <LoadingState label="A carregar visão geral..." /> : null}

      {summary.error ? (
        <InfoState
          title="Não foi possível abrir a app"
          message={summary.error}
          action={<AppButton label="Tentar novamente" onPress={() => void reload()} />}
        />
      ) : null}

      {summary.data ? (
        <>
          <SectionHeader>Resumo</SectionHeader>
          <InsetGroup>
            <ListRow title="Receitas" subtitle="Disponíveis no catálogo" accessory={<CountText value={summary.data.recipesCount} />} />
            <ListRow title="Stock ativo" subtitle="Entradas utilizáveis no inventário" accessory={<CountText value={summary.data.inventoryActiveCount} />} />
            <ListRow title="Compras pendentes" subtitle="Itens ainda por comprar" accessory={<CountText value={summary.data.shoppingPendingCount} />} />
            <ListRow title="Regras familiares" subtitle="Preferências e restrições" accessory={<CountText value={summary.data.rulesCount} />} />
          </InsetGroup>

          <SectionHeader>Abrir módulo</SectionHeader>
          <InsetGroup>
            {primaryActions.map((action) => (
              <ListRow
                key={action.href}
                title={action.title}
                subtitle={action.description}
                accessory={
                  summary.data && action.statKey ? <CountText value={summary.data[action.statKey]} /> : undefined
                }
                onPress={() => router.push(action.href)}
              />
            ))}
          </InsetGroup>

          <SectionHeader>Próximas refeições</SectionHeader>
          <SectionCard>
            {summary.data.upcomingMeals.length === 0 ? (
              <ThemedText themeColor="textSecondary">Ainda não tens refeições planeadas.</ThemedText>
            ) : (
              <InsetGroup>
                {summary.data.upcomingMeals.map((meal) => (
                  <ListRow
                    key={meal.id}
                    title={meal.recipe?.name ?? 'Receita em falta'}
                    subtitle={`${formatDate(meal.planned_date)} · ${meal.meal_slot}`}
                  />
                ))}
              </InsetGroup>
            )}
          </SectionCard>

          <SectionHeader>Stock a vigiar</SectionHeader>
          <SectionCard>
            {summary.data.lowStockEntries.length === 0 ? (
              <ThemedText themeColor="textSecondary">Nenhuma entrada está em zona de stock baixo.</ThemedText>
            ) : (
              <InsetGroup>
                {summary.data.lowStockEntries.map((entry) => (
                  <ListRow
                    key={entry.id}
                    title={entry.ingredient_name}
                    subtitle={`Restante ${formatQuantity(entry.quantity_remaining, entry.unit)}`}
                  />
                ))}
              </InsetGroup>
            )}
          </SectionCard>
        </>
      ) : null}
    </AppScreen>
  );
}

function CountText({ value }: { value: number }) {
  return <ThemedText style={styles.count}>{String(value)}</ThemedText>;
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    paddingTop: 4,
  },
  lead: {
    fontSize: 15,
    lineHeight: 20,
  },
  count: {
    color: IOSColors.blue,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
});
