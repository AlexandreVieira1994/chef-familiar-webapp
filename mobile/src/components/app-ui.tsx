import { PropsWithChildren, ReactNode, useMemo, useState } from 'react';
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
import { BottomTabInset, IOSColors, MaxContentWidth, Spacing } from '@/constants/theme';
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
  const theme = useTheme();

  return <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>{children}</View>;
}

export function SectionHeader({ children }: PropsWithChildren) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
      {children}
    </ThemedText>
  );
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
  const theme = useTheme();
  const buttonStyles = [
    styles.button,
    tone === 'primary' && styles.buttonPrimary,
    tone === 'secondary' && [styles.buttonSecondary, { backgroundColor: theme.backgroundSelected }],
    tone === 'danger' && [styles.buttonDanger, { backgroundColor: theme.backgroundSelected }],
    disabled && styles.buttonDisabled,
  ];
  const textStyles = [
    styles.buttonText,
    tone === 'secondary' && styles.buttonTextSecondary,
    tone === 'danger' && styles.buttonTextDanger,
  ];

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
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={tone === 'danger' ? styles.dangerText : [styles.inlineText, { color: theme.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ButtonRow({ children }: PropsWithChildren) {
  return <View style={styles.buttonRow}>{children}</View>;
}

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoGrow?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url';
  editable?: boolean;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  autoGrow,
  keyboardType = 'default',
  editable = true,
}: FormFieldProps) {
  const theme = useTheme();
  const autoGrowHeight = useMemo(() => {
    if (!autoGrow) return undefined;

    const lines = value.split('\n').reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 34)), 0);

    return Math.min(Math.max(lines * 22 + 22, 44), 156);
  }, [autoGrow, value]);

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
        editable={editable}
        numberOfLines={autoGrow ? 1 : undefined}
        scrollEnabled={!autoGrow}
        style={[
          styles.input,
          multiline && !autoGrow && styles.textArea,
          multiline && autoGrow && styles.autoGrowTextArea,
          autoGrow && { height: autoGrowHeight },
          !editable && styles.inputDisabled,
          {
            color: theme.text,
            borderColor: 'rgba(120, 120, 120, 0.18)',
            backgroundColor: theme.background,
          },
        ]}
      />
    </View>
  );
}

type ChipOption<TValue extends string> = {
  label: string;
  value: TValue;
};

export type SelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type SelectFieldProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: SelectOption<TValue>[];
  onChange: (value: TValue) => void;
  enabled?: boolean;
};

export function SelectField<TValue extends string>({
  label,
  value,
  options,
  onChange,
  enabled = true,
}: SelectFieldProps<TValue>) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(normalizedQuery);
      const valueMatch = option.value.toLowerCase().includes(normalizedQuery);

      return labelMatch || valueMatch;
    });
  }, [options, query]);

  function openMenu() {
    if (!enabled) return;

    setQuery('');
    setMenuVisible(true);
  }

  function closeMenu() {
    setMenuVisible(false);
    setQuery('');
  }

  function selectOption(nextValue: TValue) {
    onChange(nextValue);
    closeMenu();
  }

  return (
    <View style={styles.fieldGroup}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        disabled={!enabled}
        onPress={openMenu}
        style={({ pressed }) => [
          styles.selectButton,
          {
            borderColor: 'rgba(120, 120, 120, 0.18)',
            backgroundColor: theme.background,
          },
          !enabled && styles.inputDisabled,
          pressed && enabled && styles.pressed,
        ]}>
        <ThemedText style={selectedOption ? styles.selectButtonText : [styles.selectButtonText, { color: theme.textSecondary }]}>
          {selectedOption?.label ?? (value || 'Selecionar')}
        </ThemedText>
        <ThemedText style={[styles.selectChevron, { color: theme.textSecondary }]}>⌄</ThemedText>
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <View style={styles.floatingMenuRoot}>
          <Pressable style={styles.floatingBackdrop} onPress={closeMenu} />
          <View style={[styles.floatingPanel, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.floatingHeader}>
              <ThemedText type="subtitle" style={styles.floatingTitle}>
                {label}
              </ThemedText>
              <InlineButton label="Fechar" onPress={closeMenu} />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Pesquisar"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              style={[
                styles.searchInput,
                {
                  color: theme.text,
                  borderColor: 'rgba(120, 120, 120, 0.18)',
                  backgroundColor: theme.background,
                },
              ]}
            />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.optionList}>
              {filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const selected = option.value === value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => selectOption(option.value)}
                      style={({ pressed }) => [
                        styles.optionRow,
                        { backgroundColor: selected ? theme.backgroundSelected : theme.background },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText style={styles.optionText}>{option.label}</ThemedText>
                      {selected ? <Tag>selecionada</Tag> : null}
                    </Pressable>
                  );
                })
              ) : (
                <ThemedText themeColor="textSecondary" style={styles.emptySearch}>
                  Sem opções correspondentes.
                </ThemedText>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  const theme = useTheme();

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
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: theme.backgroundSelected },
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}>
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
  const theme = useTheme();

  return (
    <View style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="small">{children}</ThemedText>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  accessory,
  onPress,
}: {
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();

  const content = (
    <View style={styles.listRow}>
      <View style={styles.listRowText}>
        <ThemedText style={styles.listRowTitle}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText themeColor="textSecondary" style={styles.listRowSubtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.listRowAccessory}>
        {accessory}
        {onPress ? <ThemedText style={[styles.chevron, { color: theme.textSecondary }]}>›</ThemedText> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export function InsetGroup({ children }: PropsWithChildren) {
  const theme = useTheme();

  return <View style={[styles.insetGroup, { backgroundColor: theme.backgroundElement }]}>{children}</View>;
}

type FormModalProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
}>;

export function FormModal({ visible, title, onClose, footer, children }: FormModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.modalScreen}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <InlineButton label="Cancelar" onPress={onClose} />
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {title}
            </ThemedText>
            <View style={styles.modalHeaderSpacer} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>{children}</ScrollView>
          {footer ? <View style={[styles.modalFooter, { backgroundColor: theme.background }]}>{footer}</View> : null}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 20,
  },
  card: {
    gap: 12,
    borderRadius: 14,
    padding: 16,
    backgroundColor: IOSColors.secondaryGroupedBackground,
  },
  sectionHeader: {
    marginBottom: -8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  button: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: IOSColors.blue,
  },
  buttonSecondary: {
    backgroundColor: IOSColors.tertiaryFill,
  },
  buttonDanger: {
    backgroundColor: '#FFE9E8',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 600,
  },
  buttonTextSecondary: {
    color: IOSColors.blue,
    fontWeight: 600,
  },
  buttonTextDanger: {
    color: IOSColors.red,
    fontWeight: 600,
  },
  inlineButton: {
    paddingVertical: 8,
    minWidth: 64,
  },
  inlineText: {
    color: IOSColors.blue,
  },
  dangerText: {
    color: IOSColors.red,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroup: {
    gap: 6,
  },
  input: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  autoGrowTextArea: {
    minHeight: 44,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    opacity: 0.55,
  },
  selectButton: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  selectChevron: {
    fontSize: 18,
    lineHeight: 20,
  },
  floatingMenuRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  floatingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  floatingPanel: {
    maxHeight: '74%',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  floatingTitle: {
    flex: 1,
  },
  searchInput: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  optionList: {
    gap: 8,
    paddingBottom: 2,
  },
  optionRow: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  emptySearch: {
    paddingVertical: 18,
    textAlign: 'center',
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
    backgroundColor: IOSColors.tertiaryFill,
  },
  chipSelected: {
    backgroundColor: '#DCEBFF',
  },
  chipText: {
    color: '#3A3A3C',
  },
  chipSelectedText: {
    color: IOSColors.blue,
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
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: IOSColors.tertiaryFill,
  },
  insetGroup: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: IOSColors.secondaryGroupedBackground,
  },
  listRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listRowText: {
    flex: 1,
    gap: 2,
  },
  listRowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 400,
  },
  listRowSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  listRowAccessory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    color: IOSColors.separator,
    fontSize: 24,
    lineHeight: 24,
  },
  modalScreen: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  modalHeader: {
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 600,
  },
  modalHeaderSpacer: {
    minWidth: 64,
  },
  modalContent: {
    gap: 16,
    paddingBottom: 16,
  },
  modalFooter: {
    paddingBottom: 16,
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
});
