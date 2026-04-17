import { useEffect, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EVENT_LIBRARY } from '@/constants/events';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

const TINDER_EVENT_IDS = [
  'apollo-11-first-footsteps',
  'rosa-parks-bus-boycott',
  'first-iphone',
  'd-day-normandy-landing',
  'sistine-chapel-ceiling',
  'salk-polio-vaccine',
];

const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

const TESTIMONIALS = [
  {
    quote:
      'I used to scroll for an hour in the morning. Now I read one story from Chrono and I am done. So much calmer.',
    name: 'Sarah M.',
    persona: 'Teacher',
    stars: 5,
  },
  {
    quote:
      'I dropped a moon-landing fact at dinner and everyone was impressed. My kids thought I was a genius.',
    name: 'David K.',
    persona: 'Dad of three',
    stars: 5,
  },
];

const PROOF_CHIPS = ['1 story a day', 'No noisy feed', 'Curated for curiosity'];

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 0,
    },
    header: {
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.6,
      color: colors.textPrimary,
      fontWeight: '400',
      textAlign: 'left',
    },
    subtitle: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'left',
    },
    proofPanel: {
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.md,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3,
    },
    proofPanelTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    statNumber: {
      fontFamily: serifFamily,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.8,
      color: colors.accentPrimary,
      fontWeight: '400',
    },
    statLabel: {
      flex: 1,
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    statGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statChip: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    statChipValue: {
      fontFamily: sansFamily,
      color: colors.textPrimary,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '700',
    },
    statChipLabel: {
      fontFamily: sansFamily,
      color: colors.textTertiary,
      fontSize: 11,
      lineHeight: 14,
    },
    testimonialList: {
      gap: spacing.sm,
    },
    testimonialCard: {
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    stars: {
      flexDirection: 'row',
      gap: 3,
    },
    quote: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    personaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    personaName: {
      fontFamily: sansFamily,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    personaTag: {
      fontFamily: sansFamily,
      fontSize: 13,
      color: colors.textTertiary,
    },
    dividerDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.textTertiary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    chip: {
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 1,
    },
    chipText: {
      fontFamily: sansFamily,
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    note: {
      fontFamily: sansFamily,
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
};

const StepSocialProof = (_props: StepComponentProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { styles: shared } = useMemo(() => createOnboardingStyles(theme), [theme]);

  useEffect(() => {
    const urls = TINDER_EVENT_IDS
      .map((id) => {
        const img = EVENT_LIBRARY.find((e) => e.id === id)?.image;
        if (!img || typeof img !== 'object' || !('uri' in img)) return null;
        return (img as { uri: string }).uri;
      })
      .filter((uri): uri is string => Boolean(uri));
    if (urls.length > 0) Image.prefetch(urls);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[shared.stackGap, { paddingBottom: theme.spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>You&apos;re in great company.</Text>
        <Text style={styles.subtitle}>
          Thousands of curious readers have already replaced mindless scrolling with one daily
          historical insight.
        </Text>
      </View>

      <View style={styles.proofPanel}>
        <View style={styles.proofPanelTop}>
          <Ionicons name="sparkles-outline" size={20} color={theme.colors.accentPrimary} />
          <Text style={styles.statLabel}>curious minds already exploring history every day</Text>
        </View>
        <Text style={styles.statNumber}>12,400+</Text>

        <View style={styles.statGrid}>
          <View style={styles.statChip}>
            <Text style={styles.statChipValue}>4.9/5</Text>
            <Text style={styles.statChipLabel}>Average rating</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipValue}>60 sec</Text>
            <Text style={styles.statChipLabel}>Daily read</Text>
          </View>
        </View>
      </View>

      <View style={styles.testimonialList}>
        {TESTIMONIALS.map((t) => (
          <View key={t.name} style={styles.testimonialCard}>
            <View style={styles.stars}>
              {Array.from({ length: t.stars }).map((_, i) => (
                <Ionicons key={i} name="star" size={14} color={theme.colors.accentPrimary} />
              ))}
            </View>
            <Text style={styles.quote}>{t.quote}</Text>
            <View style={styles.personaRow}>
              <Text style={styles.personaName}>{t.name}</Text>
              <View style={styles.dividerDot} />
              <Text style={styles.personaTag}>{t.persona}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.chipRow}>
        {PROOF_CHIPS.map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        Testimonials are illustrative. Real reviews are available in app store listings.
      </Text>
    </ScrollView>
  );
};

export default StepSocialProof;
