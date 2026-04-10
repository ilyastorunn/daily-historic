import { useRouter } from 'expo-router';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
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
import type { CategoryOption, EraOption } from '@/contexts/onboarding-context';
import { useUserContext } from '@/contexts/user-context';
import { trackEvent } from '@/services/analytics';
import {
  openSystemNotificationSettings,
  requestNotificationPermission,
} from '@/services/notifications';
import { useAppTheme, type ThemeDefinition } from '@/theme';

type ThemePreference = 'light' | 'dark' | 'system';
type PreferenceModalType = 'themes' | 'eras' | null;
type PreferenceChoice<T extends string> = {
  value: T;
  label: string;
  icon?: any;
  fallbackIconName?: IconSymbolName;
};

const CATEGORY_CHOICES: PreferenceChoice<CategoryOption>[] = [
  {
    value: 'world-wars',
    label: 'World Wars',
    icon: require('@/assets/icons/World-Wars.png'),
  },
  {
    value: 'ancient-civilizations',
    label: 'Ancient Worlds',
    icon: require('@/assets/icons/Ancient-Civilizations.png'),
  },
  {
    value: 'science-discovery',
    label: 'Science & Discovery',
    icon: require('@/assets/icons/Science-Discovery.png'),
  },
  {
    value: 'art-culture',
    label: 'Art & Culture',
    icon: require('@/assets/icons/Art-Culture.png'),
  },
  {
    value: 'politics',
    label: 'Leaders & Power',
    icon: require('@/assets/icons/Politics.png'),
  },
  {
    value: 'inventions',
    label: 'Breakthroughs',
    icon: require('@/assets/icons/Inventions.png'),
  },
  {
    value: 'natural-disasters',
    label: 'Forces of Nature',
    icon: require('@/assets/icons/Natural-Disasters.png'),
  },
  {
    value: 'civil-rights',
    label: 'Rights & Movements',
    icon: require('@/assets/icons/Civil-Rights.png'),
  },
  {
    value: 'exploration',
    label: 'Exploration',
    icon: require('@/assets/icons/Explorations.png'),
  },
  { value: 'surprise', label: 'Surprise me', fallbackIconName: 'sparkles' },
];

const ERA_CHOICES: PreferenceChoice<EraOption>[] = [
  { value: 'prehistory', label: 'Prehistory', icon: require('@/assets/icons/Prehistory.png') },
  { value: 'ancient', label: 'Ancient Worlds', icon: require('@/assets/icons/Ancient-Worlds.png') },
  { value: 'medieval', label: 'Medieval', icon: require('@/assets/icons/Medieval.png') },
  {
    value: 'early-modern',
    label: 'Early Modern',
    icon: require('@/assets/icons/Early-Modern.png'),
  },
  {
    value: 'nineteenth',
    label: '19th Century',
    icon: require('@/assets/icons/19th-Century.png'),
  },
  {
    value: 'twentieth',
    label: '20th Century',
    icon: require('@/assets/icons/20th-Century.png'),
  },
  {
    value: 'contemporary',
    label: 'Contemporary',
    icon: require('@/assets/icons/Contemporary.png'),
  },
];

const accountLabels: Record<string, string> = {
  apple: 'Signed in with Apple',
  google: 'Signed in with Google',
  email: 'Signed in with email',
  anonymous: 'Guest session',
  meta: 'Signed in with Meta',
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
      gap: spacing.lg,
      paddingTop: spacing.sm,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
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
      backgroundColor: colors.appBackground,
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
    reminderPermissionWarning: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'rgba(220, 38, 38, 0.32)',
      backgroundColor: 'rgba(220, 38, 38, 0.08)',
    },
    reminderPermissionWarningText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: 18,
      color: '#8A1C1C',
    },
    reminderPermissionWarningAction: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    reminderPermissionWarningActionPressed: {
      opacity: 0.85,
    },
    reminderPermissionWarningActionLabel: {
      fontFamily: sansFamily,
      fontSize: 12,
      color: colors.accentPrimary,
      fontWeight: '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    reminderTimeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.appBackground,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    reminderTimeButtonPressed: {
      opacity: 0.88,
    },
    reminderTimeLead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    reminderTimeLabel: {
      fontFamily: sansFamily,
      fontSize: 13,
      lineHeight: 16,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.35,
    },
    reminderTimeValue: {
      fontFamily: serifFamily,
      fontSize: 30,
      lineHeight: 32,
      color: colors.textPrimary,
      letterSpacing: -0.7,
    },
    reminderTimeHint: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textTertiary,
    },
    reminderTimeBody: {
      gap: spacing.xs,
    },
    reminderInlineCard: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.appBackground,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    reminderInlineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    reminderPickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.38)',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    reminderPickerCard: {
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.18,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 16 },
      elevation: 8,
    },
    reminderPickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    reminderPickerTitle: {
      fontFamily: sansFamily,
      fontSize: 18,
      lineHeight: 22,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    reminderPickerAction: {
      fontFamily: sansFamily,
      fontSize: 17,
      lineHeight: 20,
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    reminderPickerBody: {
      minHeight: 236,
      alignItems: 'stretch',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.lg,
    },
    reminderPickerControl: {
      width: '100%',
      height: 216,
      alignSelf: 'center',
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
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    pickerBackdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.34)',
    },
    pickerSheet: {
      width: '100%',
      maxHeight: '76%',
      borderRadius: radius.xl,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      backgroundColor: colors.surfaceSubtle,
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
    pickerScrollContent: {
      paddingBottom: spacing.sm,
    },
    pickerOptionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      alignContent: 'flex-start',
    },
    pickerOptionCard: {
      width: '48.5%',
      minHeight: 112,
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.appBackground,
    },
    pickerOptionCardSelected: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    pickerOptionCardPressed: {
      opacity: 0.9,
    },
    pickerOptionIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    pickerOptionIconWrapSelected: {
      borderColor: colors.accentMuted,
      backgroundColor: colors.appBackground,
    },
    pickerOptionIcon: {
      width: 24,
      height: 24,
    },
    pickerOptionLabel: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 18,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    pickerOptionLabelSelected: {
      color: colors.accentPrimary,
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

const PreferenceOptionCard = <T extends string>({
  option,
  selected,
  onPress,
  styles,
  theme,
}: {
  option: PreferenceChoice<T>;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: ThemeDefinition;
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickerOptionCard,
        selected && styles.pickerOptionCardSelected,
        pressed && styles.pickerOptionCardPressed,
      ]}
    >
      <View
        style={[
          styles.pickerOptionIconWrap,
          selected && styles.pickerOptionIconWrapSelected,
        ]}
      >
        {option.icon ? (
          <Image source={option.icon} style={styles.pickerOptionIcon} />
        ) : (
          <IconSymbol
            name={option.fallbackIconName ?? 'sparkles'}
            size={18}
            color={selected ? theme.colors.accentPrimary : theme.colors.textSecondary}
          />
        )}
      </View>
      <Text
        numberOfLines={2}
        style={[
          styles.pickerOptionLabel,
          selected && styles.pickerOptionLabelSelected,
        ]}
      >
        {option.label}
      </Text>
    </Pressable>
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
  const [isMounted, setIsMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!isMounted) {
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [isMounted, progress, visible]);

  if (!isMounted) {
    return null;
  }

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const sheetTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [48, 0],
  });
  const sheetOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <Modal animationType="none" transparent visible={isMounted} onRequestClose={onClose}>
      <View style={styles.pickerOverlay}>
        <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.pickerBackdrop, { opacity: backdropOpacity }]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.pickerSheet,
            {
              opacity: sheetOpacity,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.pickerHandle} />
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <Text style={styles.pickerCopy}>{copy}</Text>
          </View>

          <ScrollView
            style={styles.pickerScroll}
            contentContainerStyle={styles.pickerScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          <View style={styles.pickerDoneRow}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.signOutButton}>
              <Text style={styles.signOutLabel}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const timeStringToDate = (value: string) => {
  const [hoursString, minutesString] = value.split(':');
  const date = new Date();
  const hours = Number.parseInt(hoursString ?? '9', 10);
  const minutes = Number.parseInt(minutesString ?? '0', 10);

  date.setHours(Number.isFinite(hours) ? hours : 9);
  date.setMinutes(Number.isFinite(minutes) ? minutes : 0);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};

const dateToTimeString = (value: Date) => {
  const hours = value.getHours().toString().padStart(2, '0');
  const minutes = value.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
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
  const [showReminderPickerModal, setShowReminderPickerModal] = useState(false);
  const [draftReminderDate, setDraftReminderDate] = useState(() => timeStringToDate('09:00'));

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

  const handleReminderToggle = (next: boolean) => {
    if (!profile) {
      return;
    }

    if (!next) {
      void updateProfile({ notificationEnabled: false });
      return;
    }

    void requestNotificationPermission()
      .then((permissionState) => {
        if (permissionState === 'enabled') {
          return updateProfile({
            notificationEnabled: true,
            pushPermission: 'enabled',
            notificationTime: profile.notificationTime || '09:00',
          });
        }

        return updateProfile({
          notificationEnabled: false,
          pushPermission: 'declined',
        }).then(() => {
          Alert.alert(
            'Notifications are off',
            'Enable notification permission in system settings to receive daily reminders.',
            [
              { text: 'Not now', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  void openSystemNotificationSettings();
                },
              },
            ]
          );
        });
      })
      .catch((error) => {
        console.error('Failed to toggle reminder notifications', error);
      });
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

  const reminderTime = profile?.notificationTime ?? '09:00';
  const reminderEnabled = profile?.notificationEnabled ?? true;
  const reminderPermissionDeclined = profile?.pushPermission === 'declined';
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

  useEffect(() => {
    setDraftReminderDate(timeStringToDate(reminderTime));
  }, [reminderTime]);

  const handleOpenSavedStories = () => {
    trackEvent('profile_saved_stories_opened', { saved_count: savedStoriesCount });
    router.push('/saved-stories');
  };

  const openReminderPicker = () => {
    setDraftReminderDate(timeStringToDate(reminderTime));
    setShowReminderPickerModal(true);
  };

  const closeReminderPicker = () => {
    setShowReminderPickerModal(false);
  };

  const handleReminderPickerChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }

    setDraftReminderDate(selectedDate);
  };

  const handleInlineReminderPickerChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (!selectedDate) {
      return;
    }

    setDraftReminderDate(selectedDate);
    const nextTime = dateToTimeString(selectedDate);
    if (nextTime !== reminderTime) {
      handleReminderChange(nextTime);
    }
  };

  const handleSaveReminderPicker = () => {
    handleReminderChange(dateToTimeString(draftReminderDate));
    setShowReminderPickerModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentInsetBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
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
                  onValueChange={handleReminderToggle}
                  trackColor={{ false: theme.colors.borderSubtle, true: theme.colors.accentSoft }}
                  thumbColor={reminderEnabled ? theme.colors.accentPrimary : theme.colors.surface}
                />
              </View>

              {reminderPermissionDeclined ? (
                <View style={styles.reminderPermissionWarning}>
                  <Text style={styles.reminderPermissionWarningText}>
                    Notifications are blocked at system level. Open settings to allow daily reminders.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void openSystemNotificationSettings();
                    }}
                    style={({ pressed }) => [
                      styles.reminderPermissionWarningAction,
                      pressed && styles.reminderPermissionWarningActionPressed,
                    ]}
                  >
                    <Text style={styles.reminderPermissionWarningActionLabel}>Open Settings</Text>
                  </Pressable>
                </View>
              ) : null}

              {reminderEnabled ? (
                <View style={styles.reminderExpanded}>
                  {Platform.OS === 'ios' ? (
                    <View style={styles.reminderInlineCard}>
                      <View style={styles.reminderInlineHeader}>
                        <View style={styles.reminderTimeLead}>
                          <IconSymbol
                            name="clock.fill"
                            size={17}
                            color={theme.colors.accentPrimary}
                          />
                          <View style={styles.reminderTimeBody}>
                            <Text style={styles.reminderTimeLabel}>Delivery time</Text>
                            <Text style={styles.reminderTimeValue}>{reminderTime}</Text>
                          </View>
                        </View>
                      </View>

                      <DateTimePicker
                        value={draftReminderDate}
                        mode="time"
                        display="spinner"
                        minuteInterval={5}
                        style={styles.reminderPickerControl}
                        textColor={theme.colors.textPrimary}
                        themeVariant={theme.mode}
                        onChange={handleInlineReminderPickerChange}
                      />
                    </View>
                  ) : (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Reminder time, ${reminderTime}`}
                        onPress={openReminderPicker}
                        style={({ pressed }) => [
                          styles.reminderTimeButton,
                          pressed && styles.reminderTimeButtonPressed,
                        ]}
                      >
                        <View style={styles.reminderTimeLead}>
                          <IconSymbol
                            name="clock.fill"
                            size={17}
                            color={theme.colors.accentPrimary}
                          />
                          <View style={styles.reminderTimeBody}>
                            <Text style={styles.reminderTimeLabel}>Delivery time</Text>
                            <Text style={styles.reminderTimeValue}>{reminderTime}</Text>
                          </View>
                        </View>
                        <IconSymbol
                          name="chevron.right"
                          size={17}
                          color={theme.colors.textSecondary}
                        />
                      </Pressable>
                      <Text style={styles.reminderTimeHint}>
                        Tap to pick the time with the native time picker.
                      </Text>
                    </>
                  )}
                </View>
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

      <Modal
        animationType="fade"
        transparent
        visible={showReminderPickerModal}
        onRequestClose={closeReminderPicker}
      >
        <View style={styles.reminderPickerOverlay}>
          <View style={styles.reminderPickerCard}>
            <View style={styles.reminderPickerHeader}>
              <Pressable accessibilityRole="button" onPress={closeReminderPicker}>
                <Text style={styles.reminderPickerAction}>Cancel</Text>
              </Pressable>
              <Text style={styles.reminderPickerTitle}>Edit Reminder</Text>
              <Pressable accessibilityRole="button" onPress={handleSaveReminderPicker}>
                <Text style={styles.reminderPickerAction}>Save</Text>
              </Pressable>
            </View>

            <View style={styles.reminderPickerBody}>
              <DateTimePicker
                value={draftReminderDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minuteInterval={5}
                style={styles.reminderPickerControl}
                textColor={Platform.OS === 'ios' ? theme.colors.textPrimary : undefined}
                themeVariant={Platform.OS === 'ios' ? theme.mode : undefined}
                onChange={handleReminderPickerChange}
              />
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
        <View style={styles.pickerOptionGrid}>
          {activePreferenceModal === 'themes'
            ? CATEGORY_CHOICES.map((option) => {
                const selected = profile?.categories?.includes(option.value) ?? false;

                return (
                  <PreferenceOptionCard
                    key={option.value}
                    option={option}
                    selected={selected}
                    onPress={() => handleToggleCategory(option.value)}
                    styles={styles}
                    theme={theme}
                  />
                );
              })
            : ERA_CHOICES.map((option) => {
                const selected = profile?.eras?.includes(option.value) ?? false;

                return (
                  <PreferenceOptionCard
                    key={option.value}
                    option={option}
                    selected={selected}
                    onPress={() => handleToggleEra(option.value)}
                    styles={styles}
                    theme={theme}
                  />
                );
              })}
        </View>
      </PreferencePickerModal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
