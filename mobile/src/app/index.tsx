import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const primaryActions = [
  {
    title: 'Inventário',
    description: 'Ingredientes, lotes, validades e stock disponível.',
    href: '/inventory',
    symbol: '🥕',
  },
  {
    title: 'Receitas',
    description: 'Receitas por testar, aprovadas, neutras e rejeitadas.',
    href: '/recipes',
    symbol: '🍲',
  },
  {
    title: 'Plano semanal',
    description: 'Refeições por data e momento do dia.',
    href: '/planner',
    symbol: '📅',
  },
  {
    title: 'Compras',
    description: 'Lista ativa e ingredientes em falta.',
    href: '/shopping',
    symbol: '🛒',
  },
  {
    title: 'Regras familiares',
    description: 'Preferências usadas pelo planeador e pela IA.',
    href: '/rules',
    symbol: '⚙️',
  },
] as const;

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>MVP mobile</Text>
          <Text style={styles.heroTitle}>Chef Familiar</Text>
          <Text style={styles.heroText}>
            Gestão simples de receitas, inventário, plano semanal, compras e regras familiares.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações principais</Text>
          <View style={styles.groupedList}>
            {primaryActions.map((action, index) => (
              <Link key={action.href} href={action.href} asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    index < primaryActions.length - 1 && styles.rowBorder,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.symbol}>{action.symbol}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{action.title}</Text>
                    <Text style={styles.rowDescription}>{action.description}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Próximo passo</Text>
          <Text style={styles.noteText}>
            Ligar primeiro a leitura real do Supabase. Só depois adicionar escrita, edição e ações
            persistentes com confirmação.
          </Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    paddingBottom: 40,
  },
  safeArea: {
    paddingHorizontal: 20,
    gap: 24,
  },
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
    letterSpacing: -0.8,
  },
  heroText: {
    color: '#4B5563',
    fontSize: 17,
    lineHeight: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupedList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowBorder: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.55,
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
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 19,
  },
  chevron: {
    color: '#9CA3AF',
    fontSize: 30,
    lineHeight: 30,
  },
  noteCard: {
    backgroundColor: '#E8F3FF',
    borderRadius: 22,
    padding: 18,
    gap: 6,
  },
  noteTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  noteText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 21,
  },
});
