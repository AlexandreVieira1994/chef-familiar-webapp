import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const primaryActions = [
  {
    title: 'Inventario',
    description: 'Ingredientes, lotes, validades, locais e stock disponivel.',
    href: '/inventory',
  },
  {
    title: 'Receitas',
    description: 'Receitas por testar, aprovadas, neutras, a melhorar e rejeitadas.',
    href: '/recipes',
  },
  {
    title: 'Plano semanal',
    description: 'Refeicoes planeadas por data e momento do dia.',
    href: '/planner',
  },
  {
    title: 'Compras',
    description: 'Lista ativa e ingredientes em falta.',
    href: '/shopping',
  },
  {
    title: 'Regras familiares',
    description: 'Preferencias e restricoes usadas pelo planeador e pela IA.',
    href: '/rules',
  },
] as const;

export default function HomeScreen() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Chef Familiar
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Interface mobile ligada a mesma arquitetura da web app: inventario, receitas,
              planeamento, compras e regras familiares.
            </ThemedText>
          </View>

          <View style={styles.statusCard}>
            <ThemedText type="subtitle">Prioridade mobile</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Comecar por leitura simples das tabelas reais do Supabase. Depois adicionar criacao e
              edicao segura, com confirmacao quando houver alteracoes persistentes.
            </ThemedText>
          </View>

          <View style={styles.grid}>
            {primaryActions.map((action) => (
              <Link key={action.href} href={action.href} asChild>
                <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                  <ThemedText type="subtitle">{action.title}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.cardDescription}>
                    {action.description}
                  </ThemedText>
                </Pressable>
              </Link>
            ))}
          </View>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 34,
  },
  subtitle: {
    lineHeight: 22,
  },
  paragraph: {
    lineHeight: 21,
  },
  statusCard: {
    gap: Spacing.two,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    backgroundColor: 'rgba(120, 120, 120, 0.12)',
  },
  grid: {
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    backgroundColor: 'rgba(120, 120, 120, 0.10)',
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardDescription: {
    lineHeight: 20,
  },
});
