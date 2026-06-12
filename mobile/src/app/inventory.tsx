import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const fields = [
  'entry_date',
  'ingredient_name',
  'quantity_initial',
  'quantity_remaining',
  'unit',
  'category',
  'source',
  'expiry_date',
  'storage_location',
  'status',
  'notes',
];

export default function InventoryScreen() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Inventario</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Este ecra vai ler a tabela inventory_entries do Supabase e mostrar entradas por lote,
              sem consolidar compras repetidas.
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Regras importantes</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Cada compra deve criar uma nova entrada. Remocoes devem continuar como soft delete:
              quantity_remaining igual a 0, status removido e nota de remocao.
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Campos da tabela</ThemedText>
            <View style={styles.tags}>
              {fields.map((field) => (
                <View key={field} style={styles.tag}>
                  <ThemedText type="small">{field}</ThemedText>
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
