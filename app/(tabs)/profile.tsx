import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { SelectableChip } from '@/components/ui/selectable-chip';
import type { CategoryOption, EraOption } from '@/contexts/onboarding-context';
import { useUserContext } from '@/contexts/user-context';
import { trackEvent } from '@/services/analytics';
import { useAppTheme, type ThemeDefinition } from '@/theme';

type ThemePreference = 'light' | 'dark' | 'system';
type PreferenceModalType = 'themes' | 'eras' | null;

const CATEGORY_CHOICES: { value: CategoryOption; label: string }[] = [
  { value: 'world-wars', label: 'World Wars' },
  { value: 'ancient-civilizations', label: 'Ancient Worlds' },
  { value: 'science-discovery', label: 'Science & Discovery' },
  { value: 'art-culture', label: 'Art & Culture' },
  { value: 'politics', label: 'Leaders & Power' },
  { value: 'inventions', label: 'Breakthroughs' },
  { value: 'natural-disasters', label: 'Forces of Nature' },
  { value: 'civil-rights', label: 'Rights & Movements' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'surprise', label: 'Surprise me' },
];

const ERA_CHOICES: { value: EraOption; label: string }[] = [
  { value: 'prehistory', label: 'Prehistory' },
  { value: 'ancient', label: 'Ancient Worlds' },
  { value: 'medieval', label: 'Medieval' },
  { value: 'early-modern', label: 'Early Modern' },
  { value: 'nineteenth', label: '19th Century' },
  { value: 'twentieth', label: '20th Century' },
  { value: 'contemporary', label: 'Contemporary' },
];

const accountLabels: Record<string, string> = {
  apple: 'Apple account',
  google: 'Google account',
  email: 'Email account',
  anonymous: 'Guest session',
  meta: 'Meta account',
};

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  iconName: IconSymbolName;
}[] = [
  { value: 'light', label: 'Light', iconName: 'sun.max.fill' },
  { value: 'dark', label: 'Dark', iconName: 'moon.fill' },
  { value: 'system', label: 'System', iconName: 'circle.lefthalf.filled' },
];

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_CHOICES.map((option) => [option.value, option.label])
) as Record<CategoryOption, string>;

const ERA_LABELS = Object.fromEntries(
  ERA_CHOICES.map((option) => [option.value, option.label])
) as Record<EraOption, string>;

const buildReminderTimeOptions = () => {
  const times: string[] = [];

  for (let minutes = 7 * 60; minutes <= 22 * 60; minutes += 30) {
    const hours = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    times.push(`${hours}:${mins}`);
  }

  return times;
};

const REMINDER_TIME_OPTIONS = buildReminderTimeOptions();

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({
    ios: 'Times New Roman',
    android: 'serif',
    default: 'serif',
  });
  const sansFamily = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  });

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.appBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.screen,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      gap: spacing.xl,
    },
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.heroBorder,
      backgroundColor: colors.surface,
      padding: spacing.xl,
      gap: spacing.lg,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 5,
    },
    heroOrbPrimary: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      top: -120,
      right: -72,
      backgroundColor: colors.accentSoft,
    },
    heroOrbSecondary: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      bottom: -84,
      left: -68,
      backgroundColor: colors.surfaceSubtle,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.heroBorder,
    },
    heroBadgeText: {
      fontFamily: sansFamily,
      fontSize: 12,
      fontWeight: '600',
      color: colors.accentPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    greeting: {
      fontFamily: serifFamily,
      fontSize: 40,
      lineHeight: 44,
      color: colors.textPrimary,
      letterSpacing: -0.8,
      maxWidth: 280,
    },
    heroCopy: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: 24,
      color: colors.textSecondary,
      maxWidth: 310,
    },
    identityPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
    },
    identityPillText: {
      fontFamily: sansFamily,
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    heroMetricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    heroMetricCard: {
      flex: 1,
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.46)',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    heroMetricCardInteractive: {
      alignItems: 'stretch',
    },
    heroMetricCardPressed: {
      opacity: 0.9,
    },
    heroMetricTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    heroMetricValue: {
      fontFamily: serifFamily,
      fontSize: 24,
      lineHeight: 28,
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    heroMetricChevron: {
      paddingTop: 2,
    },
    heroMetricLabel: {
      fontFamily: sansFamily,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    heroFootnoteRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    heroFootnoteCard: {
      flex: 1,
      minWidth: 132,
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSubtle,
    },
    heroFootnoteLabel: {
      fontFamily: sansFamily,
      fontSize: 12,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    heroFootnoteValue: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 18,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    sectionBlock: {
      gap: spacing.lg,
    },
    sectionHeading: {
      gap: spacing.sm,
    },
    sectionEyebrow: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
    },
    sectionEyebrowText: {
      fontFamily: sansFamily,
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionTitle: {
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 32,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    sectionCopy: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
      maxWidth: 320,
    },
    sectionContent: {
      gap: spacing.md,
    },
    featureCard: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    featureHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    featureLead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    featureIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSoft,
    },
    featureTitleGroup: {
      flex: 1,
      gap: spacing.xs,
    },
    featureTitle: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    featureMeta: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    themeOptionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    themeOption: {
      flex: 1,
      minWidth: 0,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    themeOptionSelected: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    themeOptionPressed: {
      opacity: 0.88,
    },
    themeOptionInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    themeOptionLabel: {
      fontFamily: sansFamily,
      fontSize: 13,
      lineHeight: 16,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    themeOptionLabelSelected: {
      color: colors.accentPrimary,
    },
    reminderExpanded: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
    reminderDisplayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    reminderTimeBox: {
      minWidth: 78,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    reminderTimeBoxText: {
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 30,
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },
    reminderColon: {
      fontFamily: serifFamily,
      fontSize: 26,
      lineHeight: 30,
      color: colors.textSecondary,
    },
    reminderSliderPanel: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.58)',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    reminderSliderTrackWrap: {
      height: 34,
      justifyContent: 'center',
    },
    reminderSliderTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.progressTrack,
    },
    reminderSliderActiveTrack: {
      position: 'absolute',
      left: 0,
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.accentPrimary,
    },
    reminderSliderThumb: {
      position: 'absolute',
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: colors.surface,
      backgroundColor: colors.accentPrimary,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    reminderMarkersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    reminderMarker: {
      fontFamily: sansFamily,
      fontSize: 11,
      lineHeight: 14,
      color: colors.textTertiary,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    summaryCard: {
      flex: 1,
      minWidth: 132,
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    summaryCardPressed: {
      opacity: 0.9,
    },
    summaryTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    summaryValue: {
      fontFamily: serifFamily,
      fontSize: 24,
      lineHeight: 28,
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    summaryLabel: {
      fontFamily: sansFamily,
      fontSize: 12,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    summaryMeta: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    accountIdentityCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    accountIdentityIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountIdentityBody: {
      flex: 1,
      gap: spacing.xs,
    },
    accountIdentityTitle: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    accountIdentityCopy: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    linkList: {
      gap: spacing.sm,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    linkBody: {
      flex: 1,
      gap: spacing.xs,
    },
    linkTitle: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    linkMeta: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    signOutButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
    },
    signOutLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    deleteButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(220, 38, 38, 0.28)',
      backgroundColor: 'rgba(220, 38, 38, 0.08)',
    },
    deleteLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: '#B42318',
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    authErrorText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: '#B42318',
      lineHeight: 18,
    },
    developmentCard: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    developmentTitle: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    developmentCopy: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: radius.xl,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: spacing.md,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    modalTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    modalCopy: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.md,
      backgroundColor: colors.appBackground,
      color: colors.textPrimary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    pickerSheet: {
      width: '100%',
      maxHeight: '76%',
      borderRadius: radius.xl,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: spacing.md,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.18,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 16 },
      elevation: 8,
    },
    pickerHandle: {
      alignSelf: 'center',
      width: 52,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.borderStrong,
      opacity: 0.8,
      marginBottom: spacing.xs,
    },
    pickerHeader: {
      gap: spacing.sm,
    },
    pickerTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    pickerCopy: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: 19,
      color: colors.textSecondary,
    },
    pickerScroll: {
      maxHeight: 340,
    },
    pickerDoneRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
  });
};

const SectionBlock = ({
  eyebrow,
  title,
  copy,
  styles,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  styles: ReturnType<typeof createStyles>;
  children: ReactNode;
}) => {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionEyebrow}>
          <Text style={styles.sectionEyebrowText}>{eyebrow}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCopy}>{copy}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

const HeroMetric = ({
  label,
  value,
  styles,
  theme,
  onPress,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  theme: ThemeDefinition;
  onPress?: () => void;
}) => {
  const content = (
    <>
      <View style={styles.heroMetricTopRow}>
        <Text style={styles.heroMetricValue}>{value}</Text>
        {onPress ? (
          <View style={styles.heroMetricChevron}>
            <IconSymbol name="chevron.right" size={15} color={theme.colors.textSecondary} />
          </View>
        ) : null}
      </View>
      <Text style={styles.heroMetricLabel}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.heroMetricCard}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, open saved stories`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.heroMetricCard,
        styles.heroMetricCardInteractive,
        pressed && styles.heroMetricCardPressed,
      ]}
    >
      {content}
    </Pressable>
  );
};

const AccountLinkRow = ({
  title,
  meta,
  onPress,
  styles,
  theme,
}: {
  title: string;
  meta: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: ThemeDefinition;
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.linkBody}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkMeta}>{meta}</Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={theme.colors.textSecondary} />
    </Pressable>
  );
};

const ThemeOptionRow = ({
  value,
  onChange,
  styles,
  theme,
}: {
  value: ThemePreference;
  onChange: (preference: ThemePreference) => void;
  styles: ReturnType<typeof createStyles>;
  theme: ThemeDefinition;
}) => {
  return (
    <View style={styles.themeOptionsRow}>
      {THEME_OPTIONS.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} theme`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.themeOption,
              selected && styles.themeOptionSelected,
              pressed && styles.themeOptionPressed,
            ]}
          >
            <View style={styles.themeOptionInner}>
              <IconSymbol
                name={option.iconName}
                size={15}
                color={selected ? theme.colors.accentPrimary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.themeOptionLabel,
                  selected && styles.themeOptionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const PreferenceSummaryCard = ({
  label,
  value,
  summary,
  onPress,
  styles,
  theme,
}: {
  label: string;
  value: string;
  summary: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: ThemeDefinition;
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.summaryCard, pressed && styles.summaryCardPressed]}
    >
      <View style={styles.summaryTopRow}>
        <Text style={styles.summaryValue}>{value}</Text>
        <IconSymbol name="chevron.right" size={15} color={theme.colors.textSecondary} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryMeta}>{summary}</Text>
    </Pressable>
  );
};

const ReminderTimeSlider = ({
  value,
  onChange,
  styles,
}: {
  value: string;
  onChange: (time: string) => void;
  styles: ReturnType<typeof createStyles>;
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const initialTouchXRef = useRef(0);
  const selectedIndex = Math.max(REMINDER_TIME_OPTIONS.indexOf(value), 0);
  const [hours, minutes] = value.split(':');

  const selectTimeFromPosition = useCallback(
    (position: number) => {
      if (trackWidth <= 0) {
        return;
      }

      const clampedPosition = Math.max(0, Math.min(trackWidth, position));
      const percentage = clampedPosition / trackWidth;
      const nextIndex = Math.round(percentage * (REMINDER_TIME_OPTIONS.length - 1));
      const nextValue = REMINDER_TIME_OPTIONS[nextIndex] ?? REMINDER_TIME_OPTIONS[0];

      if (nextValue !== value) {
        onChange(nextValue);
      }
    },
    [onChange, trackWidth, value]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          initialTouchXRef.current = event.nativeEvent.locationX;
          selectTimeFromPosition(event.nativeEvent.locationX);
        },
        onPanResponderMove: (_, gestureState) => {
          selectTimeFromPosition(initialTouchXRef.current + gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          selectTimeFromPosition(initialTouchXRef.current + gestureState.dx);
        },
      }),
    [selectTimeFromPosition]
  );

  const thumbOffset =
    trackWidth > 0
      ? (selectedIndex / (REMINDER_TIME_OPTIONS.length - 1)) * trackWidth
      : 0;
  const activeTrackWidth = Math.max(0, thumbOffset);

  return (
    <View style={styles.reminderExpanded}>
      <View style={styles.reminderDisplayRow}>
        <View style={styles.reminderTimeBox}>
          <Text style={styles.reminderTimeBoxText}>{hours}</Text>
        </View>
        <Text style={styles.reminderColon}>:</Text>
        <View style={styles.reminderTimeBox}>
          <Text style={styles.reminderTimeBoxText}>{minutes}</Text>
        </View>
      </View>

      <View style={styles.reminderSliderPanel}>
        <View
          style={styles.reminderSliderTrackWrap}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          <View style={styles.reminderSliderTrack} />
          <View style={[styles.reminderSliderActiveTrack, { width: activeTrackWidth }]} />
          <View style={[styles.reminderSliderThumb, { left: Math.max(0, thumbOffset - 13) }]} />
        </View>

        <View style={styles.reminderMarkersRow}>
          {['08:00', '12:00', '16:00', '20:00'].map((marker) => (
            <Text key={marker} style={styles.reminderMarker}>
              {marker}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const PreferencePickerModal = ({
  visible,
  title,
  copy,
  onClose,
  styles,
  children,
}: {
  visible: boolean;
  title: string;
  copy: string;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
  children: ReactNode;
}) => {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.pickerOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHandle} />
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <Text style={styles.pickerCopy}>{copy}</Text>
          </View>

          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          <View style={styles.pickerDoneRow}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.signOutButton}>
              <Text style={styles.signOutLabel}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

const formatThemePreferenceLabel = (value?: ThemePreference) => {
  switch (value) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    default:
      return 'System';
  }
};

const summarizeCategorySelection = (categories: CategoryOption[] | undefined) => {
  if (!categories || categories.length === 0) {
    return 'All themes remain open.';
  }

  if (categories.includes('surprise')) {
    return 'Surprise mode is steering the archive.';
  }

  if (categories.length === 1) {
    return `${CATEGORY_LABELS[categories[0]]} is currently in focus.`;
  }

  return `${categories.length} themes are shaping the feed.`;
};

const summarizeEraSelection = (eras: EraOption[] | undefined) => {
  if (!eras || eras.length === 0) {
    return 'Every era can still surface in the archive.';
  }

  if (eras.length === 1) {
    return `${ERA_LABELS[eras[0]]} leads the timeline right now.`;
  }

  return `${eras.length} eras are currently highlighted.`;
};

const ProfileScreen = () => {
  const {
    authAccountSelection,
    authBusy,
    authError,
    clearAuthError,
    deleteAccount,
    isAnonymousSession,
    profile,
    signOut,
    updateProfile,
  } = useUserContext();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [activePreferenceModal, setActivePreferenceModal] = useState<PreferenceModalType>(null);

  const handleToggleCategory = (value: CategoryOption) => {
    if (!profile) {
      return;
    }

    const current = profile.categories ?? [];
    if (value === 'surprise') {
      void updateProfile({ categories: ['surprise'], categoriesSkipped: false });
      return;
    }

    const withoutSurprise = current.filter((item) => item !== 'surprise');
    const next = withoutSurprise.includes(value)
      ? withoutSurprise.filter((item) => item !== value)
      : [...withoutSurprise, value];

    void updateProfile({
      categories: next,
      categoriesSkipped: next.length === 0,
    });
  };

  const handleToggleEra = (value: EraOption) => {
    if (!profile) {
      return;
    }

    const current = profile.eras ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    void updateProfile({ eras: next });
  };

  const handleReminderChange = (time: string) => {
    void updateProfile({ notificationTime: time });
  };

  const handleThemeChange = (preference: ThemePreference) => {
    const previousValue = profile?.themePreference ?? 'system';
    trackEvent('theme_changed', {
      from: previousValue,
      to: preference,
    });
    void updateProfile({ themePreference: preference });
  };

  const handleSignOut = async () => {
    clearAuthError();
    await signOut();
    router.replace('/');
  };

  const resolvedAccountSelection = authAccountSelection ?? profile?.accountSelection ?? 'anonymous';
  const accountLabel = accountLabels[resolvedAccountSelection] ?? 'Connected account';
  const isEmailAccount = resolvedAccountSelection === 'email';

  const runDeleteAccount = async (password?: string) => {
    clearAuthError();

    try {
      await deleteAccount(password ? { password } : undefined);
      setDeletePassword('');
      setShowDeletePasswordModal(false);
      Alert.alert('Account deleted', 'Your account was deleted successfully.', [
        {
          text: 'Continue',
          onPress: () => router.replace('/onboarding'),
        },
      ]);
    } catch {
      // Error text comes from authError state.
    }
  };

  const openDeleteConfirmation = () => {
    if (authBusy || isAnonymousSession) {
      return;
    }

    clearAuthError();

    Alert.alert('Delete account?', 'This permanently deletes your account and saved data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Final confirmation',
            'This action cannot be undone. You may be asked to verify your sign-in once more.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete account',
                style: 'destructive',
                onPress: () => {
                  if (isEmailAccount) {
                    setShowDeletePasswordModal(true);
                    return;
                  }

                  void runDeleteAccount();
                },
              },
            ]
          );
        },
      },
    ]);
  };

  const closeDeletePasswordModal = () => {
    if (authBusy) {
      return;
    }

    setDeletePassword('');
    setShowDeletePasswordModal(false);
  };

  const handleDeleteWithPassword = async () => {
    if (deletePassword.trim().length === 0 || authBusy) {
      return;
    }

    await runDeleteAccount(deletePassword);
  };

  const timezoneLabel = profile?.timezone ?? detectTimezone();
  const reminderTime = profile?.notificationTime ?? '09:00';
  const reminderEnabled = profile?.notificationEnabled ?? true;
  const displayName = profile?.displayName?.trim() || 'Historian';
  const savedStoriesCount = profile?.savedEventIds?.length ?? 0;
  const hasSurpriseMode = profile?.categories?.includes('surprise') ?? false;
  const selectedThemesCount = hasSurpriseMode
    ? 'Mix'
    : String(profile?.categories?.length ?? 0);
  const selectedErasCount = String(profile?.eras?.length ?? 0);
  const themeSummary = summarizeCategorySelection(profile?.categories);
  const eraSummary = summarizeEraSelection(profile?.eras);
  const contentInsetBottom = insets.bottom + 148;

  const handleOpenSavedStories = () => {
    trackEvent('profile_saved_stories_opened', { saved_count: savedStoriesCount });
    router.push('/saved-stories');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentInsetBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View pointerEvents="none" style={styles.heroOrbPrimary} />
            <View pointerEvents="none" style={styles.heroOrbSecondary} />

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {isAnonymousSession ? 'Personal Archive' : 'Archive Synced'}
              </Text>
            </View>

            <Text style={styles.greeting}>
              {profile?.displayName ? `Hi, ${displayName}` : 'Your archive'}
            </Text>

            <Text style={styles.heroCopy}>
              Your reading ritual, saved stories, and preferences are arranged here like a personal
              archive.
            </Text>

            <View style={styles.identityPill}>
              <IconSymbol
                name="person.crop.circle.fill"
                size={18}
                color={theme.colors.accentPrimary}
              />
              <Text style={styles.identityPillText}>{accountLabel}</Text>
            </View>

            <View style={styles.heroMetricsRow}>
              <HeroMetric
                label="Saved"
                value={String(savedStoriesCount)}
                styles={styles}
                theme={theme}
                onPress={handleOpenSavedStories}
              />
              <HeroMetric label="Themes" value={selectedThemesCount} styles={styles} theme={theme} />
              <HeroMetric label="Eras" value={selectedErasCount} styles={styles} theme={theme} />
            </View>

            <View style={styles.heroFootnoteRow}>
              <View style={styles.heroFootnoteCard}>
                <Text style={styles.heroFootnoteLabel}>Reminder</Text>
                <Text style={styles.heroFootnoteValue}>
                  {reminderEnabled ? `At ${reminderTime}` : 'Off'}
                </Text>
              </View>
              <View style={styles.heroFootnoteCard}>
                <Text style={styles.heroFootnoteLabel}>Time zone</Text>
                <Text style={styles.heroFootnoteValue}>{timezoneLabel}</Text>
              </View>
            </View>
          </View>

          <SectionBlock
            eyebrow="Reading Ritual"
            title="Set the cadence"
            copy="Keep appearance and delivery quietly aligned with the way you like the archive to arrive."
            styles={styles}
          >
            <View style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <View style={styles.featureLead}>
                  <View style={styles.featureIcon}>
                    <IconSymbol name="paintbrush.fill" size={18} color={theme.colors.accentPrimary} />
                  </View>
                  <View style={styles.featureTitleGroup}>
                    <Text style={styles.featureTitle}>Appearance</Text>
                    <Text style={styles.featureMeta}>
                      {formatThemePreferenceLabel(profile?.themePreference)} mode
                    </Text>
                  </View>
                </View>
              </View>

              <ThemeOptionRow
                value={profile?.themePreference ?? 'system'}
                onChange={handleThemeChange}
                styles={styles}
                theme={theme}
              />
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <View style={styles.featureLead}>
                  <View style={styles.featureIcon}>
                    <IconSymbol name="bell.fill" size={18} color={theme.colors.accentPrimary} />
                  </View>
                  <View style={styles.featureTitleGroup}>
                    <Text style={styles.featureTitle}>Reminder</Text>
                    <Text style={styles.featureMeta}>
                      {reminderEnabled
                        ? `Chrono will arrive at ${reminderTime}.`
                        : 'Keep this off if you prefer to open the archive on your own.'}
                    </Text>
                  </View>
                </View>
                <Switch
                  accessibilityLabel="Toggle daily reminder"
                  value={reminderEnabled}
                  onValueChange={(next) => void updateProfile({ notificationEnabled: next })}
                  trackColor={{ false: theme.colors.borderSubtle, true: theme.colors.accentSoft }}
                  thumbColor={reminderEnabled ? theme.colors.accentPrimary : theme.colors.surface}
                />
              </View>

              {reminderEnabled ? (
                <ReminderTimeSlider
                  value={reminderTime}
                  onChange={handleReminderChange}
                  styles={styles}
                />
              ) : null}
            </View>
          </SectionBlock>

          <SectionBlock
            eyebrow="Your Interests"
            title="Shape the archive"
            copy="Use the small cards below to open, refine, and rebalance what history shows up next."
            styles={styles}
          >
            <View style={styles.summaryRow}>
              <PreferenceSummaryCard
                label="Themes"
                value={selectedThemesCount}
                summary={themeSummary}
                onPress={() => setActivePreferenceModal('themes')}
                styles={styles}
                theme={theme}
              />
              <PreferenceSummaryCard
                label="Eras"
                value={selectedErasCount}
                summary={eraSummary}
                onPress={() => setActivePreferenceModal('eras')}
                styles={styles}
                theme={theme}
              />
            </View>
          </SectionBlock>

          <SectionBlock
            eyebrow="Account"
            title="Access & policies"
            copy="Keep the archive connected, review key policies, or step away when you need to."
            styles={styles}
          >
            <View style={styles.accountIdentityCard}>
              <View style={styles.accountIdentityIcon}>
                <IconSymbol
                  name="person.crop.circle.fill"
                  size={22}
                  color={theme.colors.accentPrimary}
                />
              </View>
              <View style={styles.accountIdentityBody}>
                <Text style={styles.accountIdentityTitle}>{accountLabel}</Text>
                <Text style={styles.accountIdentityCopy}>
                  {isAnonymousSession
                    ? 'This archive is still living as a guest session on this device.'
                    : 'Your archive is connected and can be restored the next time you sign in.'}
                </Text>
              </View>
            </View>

            <View style={styles.linkList}>
              <AccountLinkRow
                title="Privacy Policy"
                meta="How Chrono stores, syncs, and protects your archive."
                onPress={() => router.push('/legal/privacy')}
                styles={styles}
                theme={theme}
              />
              <AccountLinkRow
                title="Terms of Use"
                meta="The agreement that governs subscriptions, access, and usage."
                onPress={() => router.push('/legal/terms')}
                styles={styles}
                theme={theme}
              />
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void handleSignOut()}
                disabled={authBusy}
                style={({ pressed }) => [
                  styles.signOutButton,
                  authBusy && { opacity: 0.65 },
                  pressed && !authBusy && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.signOutLabel}>Sign out</Text>
              </Pressable>

              {!isAnonymousSession ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={authBusy}
                  onPress={openDeleteConfirmation}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    authBusy && { opacity: 0.65 },
                    pressed && !authBusy && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.deleteLabel}>Delete account</Text>
                </Pressable>
              ) : null}
            </View>

            {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}
          </SectionBlock>

          <View style={styles.developmentCard}>
            <Text style={styles.developmentTitle}>Development</Text>
            <Text style={styles.developmentCopy}>
              Utility controls for testing flows while the app is still being shaped.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                await updateProfile({ onboardingCompleted: false });
                router.replace('/onboarding');
              }}
              style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.signOutLabel}>Reset onboarding</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={showDeletePasswordModal}
        onRequestClose={closeDeletePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm your password</Text>
            <Text style={styles.modalCopy}>
              Enter your account password to permanently delete your archive and account.
            </Text>
            <TextInput
              accessibilityLabel="Account password"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(value) => {
                clearAuthError();
                setDeletePassword(value);
              }}
              placeholder="Password"
              secureTextEntry
              style={styles.modalInput}
              value={deletePassword}
            />
            {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={authBusy}
                onPress={closeDeletePasswordModal}
                style={({ pressed }) => [
                  styles.signOutButton,
                  authBusy && { opacity: 0.65 },
                  pressed && !authBusy && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.signOutLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={authBusy || deletePassword.trim().length === 0}
                onPress={() => void handleDeleteWithPassword()}
                style={({ pressed }) => [
                  styles.deleteButton,
                  (authBusy || deletePassword.trim().length === 0) && { opacity: 0.65 },
                  pressed && !(authBusy || deletePassword.trim().length === 0) && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.deleteLabel}>{authBusy ? 'Deleting…' : 'Delete account'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <PreferencePickerModal
        visible={activePreferenceModal !== null}
        title={activePreferenceModal === 'themes' ? 'Themes' : 'Eras'}
        copy={
          activePreferenceModal === 'themes'
            ? 'Choose the corners of history you want the archive to favor. Surprise mode can still take over when you want it to.'
            : 'Tilt the archive toward the periods you return to most often.'
        }
        onClose={() => setActivePreferenceModal(null)}
        styles={styles}
      >
        <View>
          {activePreferenceModal === 'themes'
            ? CATEGORY_CHOICES.map((option) => {
                const selected = profile?.categories?.includes(option.value) ?? false;

                return (
                  <SelectableChip
                    key={option.value}
                    label={option.label}
                    selected={selected}
                    onPress={() => handleToggleCategory(option.value)}
                  />
                );
              })
            : ERA_CHOICES.map((option) => {
                const selected = profile?.eras?.includes(option.value) ?? false;

                return (
                  <SelectableChip
                    key={option.value}
                    label={option.label}
                    selected={selected}
                    onPress={() => handleToggleEra(option.value)}
                  />
                );
              })}
        </View>
      </PreferencePickerModal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
