import { Link, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, InfoState, LoadingState, SectionCard } from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatDate, formatQuantity } from '@/lib/format';
import { getDashboardSummary } from '@/lib/services';
import { useAsyncResource } from '@/hooks/use-async-resource';

const primaryActions = [
  {
    title: 'Inventário',
    description: 'Lotes, validades e stock disponível.',
    href: '/inventory',
    symbol: '🥕',
  },
  {
    title: 'Receitas',
    description: 'Receitas, estados, notas e detalhe.',
    href: '/recipes',
    symbol: '🍲',
  },
  {
    title: 'Plano semanal',
    description: 'Refeições futuras por data e momento do dia.',
    href: '/planner',
    symbol: '📅',
  },
  {
    title: 'Compras',
    description: 'Lista ativa, compras feitas e ligação ao inventário.',
    href: '/shopping',
    symbol: '🛒',
  },
  {
    title: 'Regras familiares',
    description: 'Preferências que vão alimentar o copiloto de IA.',
    href: '/rules',
    symbol: '⚙️',
  },
] as const;

export default function HomeScreen() {
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
      <View style={styles.heroCard}>
        <ThemedText style={styles.eyebrow}>Base operacional</ThemedText>
        <ThemedText type="title" style={styles.heroTitle}>
          Chef Familiar
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.heroText}>
          App mobile para receitas, inventário, plano semanal, compras e regras familiares, pronta para evoluir para um copiloto de IA com confirmação.
        </ThemedText>
      </View>

      {summary.loading ? <LoadingState label="A carregar o dashboard..." /> : null}

      {summary.error ? (
        <InfoState
          title="Não foi possível abrir o dashboard"
          message={summary.error}
          action={<AppButton label="Tentar novamente" onPress={() => void reload()} />}
        />
      ) : null}

      {summary.data ? (
        <>
          <View style={styles.statsGrid}>
            <SectionCard>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Receitas
              </ThemedText>
              <ThemedText type="subtitle">{String(summary.data.recipesCount)}</ThemedText>
            </SectionCard>
            <SectionCard>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Stock ativo
              </ThemedText>
              <ThemedText type="subtitle">{String(summary.data.inventoryActiveCount)}</ThemedText>
            </SectionCard>
            <SectionCard>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Compras em falta
              </ThemedText>
              <ThemedText type="subtitle">{String(summary.data.shoppingPendingCount)}</ThemedText>
            </SectionCard>
            <SectionCard>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Regras
              </ThemedText>
              <ThemedText type="subtitle">{String(summary.data.rulesCount)}</ThemedText>
            </SectionCard>
          </View>

          <SectionCard>
            <ThemedText type="subtitle">Atalhos principais</ThemedText>
            <View style={styles.groupedList}>
              {primaryActions.map((action, index) => (
                <Link key={action.href} href={action.href} asChild>
                  <Pressable
                    style={({ pressed }) => [
                      styles.row,
                      index < primaryActions.length - 1 && styles.rowBorder,
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText style={styles.symbol}>{action.symbol}</ThemedText>
                    <View style={styles.rowText}>
                      <ThemedText style={styles.rowTitle}>{action.title}</ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.rowDescription}>
                        {action.description}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.chevron}>›</ThemedText>
                  </Pressable>
                </Link>
              ))}
            </View>
          </SectionCard>

          <SectionCard>
            <ThemedText type="subtitle">Próximas refeições</ThemedText>
            {summary.data.upcomingMeals.length === 0 ? (
              <ThemedText themeColor="textSecondary">Ainda não há refeições planeadas.</ThemedText>
            ) : (
              <View style={styles.stack}>
                {summary.data.upcomingMeals.map((meal) => (
                  <View key={meal.id} style={styles.listRow}>
                    <ThemedText type="smallBold">
                      {formatDate(meal.planned_date)} · {meal.meal_slot}
                    </ThemedText>
                    <ThemedText>{meal.recipe?.name ?? 'Receita em falta'}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>

          <SectionCard>
            <ThemedText type="subtitle">Stock a vigiar</ThemedText>
            {summary.data.lowStockEntries.length === 0 ? (
              <ThemedText themeColor="textSecondary">Nenhuma entrada marcada como stock baixo.</ThemedText>
            ) : (
              <View style={styles.stack}>
                {summary.data.lowStockEntries.map((entry) => (
                  <View key={entry.id} style={styles.listRow}>
                    <ThemedText type="smallBold">{entry.ingredient_name}</ThemedText>
                    <ThemedText themeColor="textSecondary">
                      {formatQuantity(entry.quantity_remaining, entry.unit)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    gap: 10,
  },
  eyebrow: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 40,
  },
  heroText: {
    fontSize: 17,
    lineHeight: 24,
  },
  statsGrid: {
    gap: Spacing.three,
  },
  groupedList: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    minHeight: 76,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowBorder: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  symbol: {
    fontSize: 26,
    width: 34,
    textAlign: 'center',
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  rowDescription: {
    fontSize: 14,
    lineHeight: 19,
  },
  chevron: {
    color: '#9CA3AF',
    fontSize: 30,
    lineHeight: 30,
  },
  stack: {
    gap: Spacing.two,
  },
  listRow: {
    gap: 4,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.55,
  },
});
