import { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppScreenProps = PropsWithChildren<{
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function AppScreen({ children, refreshing, onRefresh }: AppScreenProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={theme.text} /> : undefined
        }>
        <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

export function SectionCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function CardTitle({ children }: PropsWithChildren) {
  return <ThemedText type="subtitle">{children}</ThemedText>;
}

export function FieldLabel({ children }: PropsWithChildren) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary">
      {children}
    </ThemedText>
  );
}

type AppButtonProps = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export function AppButton({ label, onPress, tone = 'primary', disabled }: AppButtonProps) {
  const buttonStyles = [styles.button, tone === 'primary' && styles.buttonPrimary, tone === 'secondary' && styles.buttonSecondary, tone === 'danger' && styles.buttonDanger, disabled && styles.buttonDisabled];
  const textStyles = [styles.buttonText, tone !== 'primary' && styles.buttonTextAlt];

  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [buttonStyles, pressed && !disabled && styles.pressed]}>
      <ThemedText style={textStyles}>{label}</ThemedText>
    </Pressable>
  );
}

type InlineButtonProps = {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
};

export function InlineButton({ label, onPress, tone = 'default' }: InlineButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={tone === 'danger' ? styles.dangerText : styles.inlineText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url';
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType = 'default',
}: FormFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.fieldGroup}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea, { color: theme.text, borderColor: 'rgba(120, 120, 120, 0.18)' }]}
      />
    </View>
  );
}

type ChipOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type ChipSelectorProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: ChipOption<TValue>[];
  onChange: (value: TValue) => void;
};

export function ChipSelector<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: ChipSelectorProps<TValue>) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={selected ? styles.chipSelectedText : styles.chipText}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function InfoState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <SectionCard>
      <View style={styles.stateBlock}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragraph}>
          {message}
        </ThemedText>
        {action}
      </View>
    </SectionCard>
  );
}

export function LoadingState({ label = 'A carregar dados...' }: { label?: string }) {
  const theme = useTheme();

  return (
    <SectionCard>
      <View style={styles.stateBlock}>
        <ActivityIndicator color={theme.text} />
        <ThemedText themeColor="textSecondary">{label}</ThemedText>
      </View>
    </SectionCard>
  );
}

export function LabeledValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.valueRow}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.valueText}>{value}</ThemedText>
    </View>
  );
}

export function Tag({ children }: PropsWithChildren) {
  return (
    <View style={styles.tag}>
      <ThemedText type="small">{children}</ThemedText>
    </View>
  );
}

type FormModalProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
}>;

export function FormModal({ visible, title, onClose, footer, children }: FormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.modalScreen}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <InlineButton label="Fechar" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>{children}</ScrollView>
          {footer ? <View style={styles.modalFooter}>{footer}</View> : null}
        </SafeAreaView>
      </ThemedView>
    </Modal>
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
  card: {
    gap: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    backgroundColor: 'rgba(120, 120, 120, 0.10)',
  },
  button: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#111827',
  },
  buttonSecondary: {
    backgroundColor: '#E2E8F0',
  },
  buttonDanger: {
    backgroundColor: '#B91C1C',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 700,
  },
  buttonTextAlt: {
    color: '#0F172A',
  },
  inlineButton: {
    paddingVertical: 8,
  },
  inlineText: {
    color: '#2563EB',
  },
  dangerText: {
    color: '#B91C1C',
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#0F172A',
  },
  chipText: {
    color: '#334155',
  },
  chipSelectedText: {
    color: '#FFFFFF',
  },
  stateBlock: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  paragraph: {
    lineHeight: 21,
  },
  valueRow: {
    gap: 4,
  },
  valueText: {
    lineHeight: 21,
  },
  tag: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(120, 120, 120, 0.12)',
  },
  modalScreen: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    paddingTop: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  modalContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  modalFooter: {
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
