import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const statuses = ['por_testar', 'aprovada', 'neutra', 'a_melhorar', 'rejeitada'];

export default function RecipesScreen() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Receitas</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Este ecra vai ler a tabela recipes e abrir detalhe por codigo. A primeira versao deve
              ser apenas leitura para validar dados reais no mobile.
            </ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Estados suportados</ThemedText>
            <View style={styles.tags}>
              {statuses.map((status) => (
                <View key={status} style={styles.tag}>
                  <ThemedText type="small">{status}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">Proxima ligacao</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.paragraph}>
              Campos principais: code, name, category, status, cost_level, notes, image_url e
              source_url.
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
