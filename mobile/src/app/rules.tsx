import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const exampleRules = [
  'Evitar carne.',
  'Priorizar vegetariano, vegan e comida simples.',
  'Evitar comida indiana e pratos muito picantes.',
  'Adaptar refeicoes para 2 adultos e bebe em BLW.',
  'Evitar leite e derivados tradicionais, preferindo alternativas vegetais.',
];

export default function RulesScreen() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Regras familiares</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Este ecra vai ler e editar a tabela family_rules, usada pelo planeador automatico e
              pelo assistente com IA.
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Modelo atual</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              A web app guarda regras como linhas independentes em family_rules. No mobile, a
              primeira versao deve listar regras, permitir editar texto e guardar com confirmacao.
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Exemplos de regras</ThemedText>
            <View style={styles.rulesList}>
              {exampleRules.map((rule) => (
                <View key={rule} style={styles.ruleRow}>
                  <ThemedText>{rule}</ThemedText>
                </View>
              ))}
            </View>
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
  paragraph: {
    lineHeight: 21,
  },
  card: {
    gap: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    backgroundColor: 'rgba(120, 120, 120, 0.10)',
  },
  rulesList: {
    gap: Spacing.two,
  },
  ruleRow: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    backgroundColor: 'rgba(120, 120, 120, 0.12)',
  },
});
