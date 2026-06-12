import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const mealSlots = ['pequeno-almoco', 'almoco', 'lanche', 'jantar'];

export default function PlannerScreen() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Plano semanal</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Este ecra vai ler meal_plan_entries e mostrar refeicoes planeadas por data e momento
              do dia.
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Momentos do dia</ThemedText>
            <View style={styles.tags}>
              {mealSlots.map((slot) => (
                <View key={slot} style={styles.tag}>
                  <ThemedText type="small">{slot}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Proxima ligacao</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Juntar meal_plan_entries com recipes para mostrar nome da receita, data, meal_slot e
              notas.
            </ThemedText>
          </View>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  header: { gap: Spacing.two },
  paragraph: { lineHeight: 21 },
  card: {
    gap: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    backgroundColor: 'rgba(120, 120, 120, 0.10)',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(120, 120, 120, 0.12)',
  },
});
