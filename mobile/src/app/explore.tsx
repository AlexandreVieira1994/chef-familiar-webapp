import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function ShoppingScreen() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Compras</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Este ecra substitui o Explore do template. A proxima iteracao deve ler a lista ativa
              em shopping_lists e os itens em shopping_list_items.
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Fluxo esperado</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Ao marcar um item como comprado, a app deve criar uma nova entrada em
              inventory_entries e associar essa entrada ao item comprado.
            </ThemedText>
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
});
