import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  ButtonRow,
  FormField,
  FormModal,
  InfoState,
  LoadingState,
  SectionCard,
  SectionHeader,
} from '@/components/app-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAsyncResource } from '@/hooks/use-async-resource';
import { slugifyRuleKey } from '@/lib/format';
import { deleteFamilyRule, listFamilyRules, upsertFamilyRule } from '@/lib/services';

export default function RulesScreen() {
  const loadRules = useCallback(() => listFamilyRules(), []);
  const rules = useAsyncResource(loadRules);
  const reload = rules.reload;
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ruleKey, setRuleKey] = useState('');
  const [ruleValue, setRuleValue] = useState('');

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  function openCreate() {
    setEditingId(null);
    setRuleKey('');
    setRuleValue('');
    setFormVisible(true);
  }

  function openEdit(rule: { id: string; rule_key: string; rule_value: string }) {
    setEditingId(rule.id);
    setRuleKey(rule.rule_key);
    setRuleValue(rule.rule_value);
    setFormVisible(true);
  }

  async function handleSave() {
    const normalizedKey = slugifyRuleKey(ruleKey);

    if (!normalizedKey || !ruleValue.trim()) {
      Alert.alert('Campos em falta', 'Preenche a chave e o texto da regra.');
      return;
    }

    setSaving(true);

    try {
      await upsertFamilyRule({
        id: editingId ?? undefined,
        rule_key: normalizedKey,
        rule_value: ruleValue.trim(),
      });
      setFormVisible(false);
      await rules.reload();
    } catch (error) {
      Alert.alert('Erro ao guardar regra', error instanceof Error ? error.message : 'Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(rule: { id: string; rule_key: string }) {
    Alert.alert('Apagar regra', `Queres mesmo apagar ${rule.rule_key}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFamilyRule(rule.id);
            await rules.reload();
          } catch (error) {
            Alert.alert('Erro ao apagar regra', error instanceof Error ? error.message : 'Tenta novamente.');
          }
        },
      },
    ]);
  }

  return (
    <AppScreen refreshing={rules.refreshing} onRefresh={() => void reload()}>
      <View style={styles.header}>
        <ThemedText type="title">Regras familiares</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragraph}>
          Regras explícitas que vão alimentar o planeamento e, mais tarde, o copiloto de IA.
        </ThemedText>
      </View>

      <ButtonRow>
        <AppButton label="Nova regra" onPress={openCreate} />
      </ButtonRow>

      {rules.loading ? <LoadingState label="A carregar regras..." /> : null}

      {rules.error ? (
        <InfoState
          title="Não foi possível carregar regras"
          message={rules.error}
          action={<AppButton label="Tentar novamente" onPress={() => void reload()} />}
        />
      ) : null}

      {rules.data && rules.data.length === 0 ? (
        <InfoState title="Sem regras" message="Ainda não tens regras familiares definidas. Cria a primeira regra para orientar o plano e o futuro assistente." />
      ) : null}

      {rules.data?.length ? <SectionHeader>Regras ativas</SectionHeader> : null}
      {rules.data?.map((rule) => (
        <SectionCard key={rule.id}>
          <View style={styles.ruleHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {rule.rule_key}
            </ThemedText>
            <ThemedText style={styles.ruleValue}>{rule.rule_value}</ThemedText>
          </View>
          <ButtonRow>
            <AppButton label="Editar" tone="secondary" onPress={() => openEdit(rule)} />
            <AppButton label="Apagar" tone="danger" onPress={() => handleDelete(rule)} />
          </ButtonRow>
        </SectionCard>
      ))}

      <FormModal
        visible={formVisible}
        title={editingId ? 'Editar regra' : 'Nova regra'}
        onClose={() => setFormVisible(false)}
        footer={<AppButton label={saving ? 'A guardar...' : 'Guardar regra'} onPress={() => void handleSave()} disabled={saving} />}>
        <FormField label="Chave" value={ruleKey} onChangeText={setRuleKey} placeholder="preferences ou fish_limit" />
        <FormField label="Texto da regra" value={ruleValue} onChangeText={setRuleValue} multiline placeholder="Ex. Peixe no máximo 2 refeições por semana." />
      </FormModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
  },
  paragraph: {
    lineHeight: 21,
  },
  ruleHeader: {
    gap: Spacing.two,
  },
  ruleValue: {
    lineHeight: 22,
  },
});
