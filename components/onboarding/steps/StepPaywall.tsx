import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import DecorativeIllustration from '../DecorativeIllustration';
import { createOnboardingStyles, spacingScale } from '../styles';
import type { StepComponentProps } from '../types';

const moonLandingIllustration = require('@/assets/illustrations/MoonLanding2.png');
const columnIllustration = require('@/assets/illustrations/column.png');

const PLAN_OPTIONS = [
  {
    key: 'annual',
    title: 'Annual',
    price: '$29.99',
    cadence: 'per year',
    badge: 'Best value',
    caption: '7-day free trial, then one quiet payment',
  },
  {
    key: 'monthly',
    title: 'Monthly',
    price: '$6.99',
    cadence: 'per month',
    badge: null,
    caption: 'Flexible access if you want to start lighter',
  },
] as const;

const FEATURE_ITEMS = [
  'Long-form Deep Dives for major moments',
  'Premium collections and extra archive access',
  'A cleaner reading ritual with priority curation',
] as const;

const createStyles = (theme: ThemeDefinition) => {
  const { colors, radius, spacing } = theme;

  return StyleSheet.create({
    scrollContent: {
      gap: spacing.xl,
      paddingBottom: spacing.xl,
    },
    heroCard: {
      overflow: 'hidden',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.heroBorder,
      backgroundColor: colors.surface,
    },
    heroGradient: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl + spacing.sm,
      gap: spacing.lg,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    heroBadgeText: {
      color: colors.overlayText,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    heroTitle: {
      maxWidth: 240,
      color: colors.overlayText,
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '600',
    },
    heroBody: {
      maxWidth: 260,
      color: 'rgba(255,255,255,0.84)',
      fontSize: 15,
      lineHeight: 22,
    },
    heroScene: {
      minHeight: 156,
      justifyContent: 'flex-end',
    },
    featureList: {
      gap: spacing.md,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
    },
    featureText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    plans: {
      gap: spacing.md,
    },
    planCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    planCardSelected: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 3,
    },
    planCardPressed: {
      transform: [{ scale: 0.99 }],
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    planTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '600',
    },
    planBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
    },
    planBadgeSelected: {
      backgroundColor: colors.accentMuted,
    },
    planBadgeText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    planBadgeTextSelected: {
      color: colors.accentPrimary,
    },
    planPriceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    planPrice: {
      color: colors.textPrimary,
      fontSize: 26,
      lineHeight: 30,
      fontWeight: '700',
    },
    planCadence: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    planCaption: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    actions: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    secondaryActionRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.lg,
      flexWrap: 'wrap',
    },
    secondaryLink: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    secondaryLinkText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    legal: {
      color: colors.textTertiary,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
  });
};

const StepPaywall = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const { styles: onboardingStyles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelectPlan = (plan: 'annual' | 'monthly') => {
    updateState({ selectedPaywallPlan: plan });
  };

  const handlePrimaryAction = () => {
    onNext();
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={onboardingStyles.section}>
        <Text style={onboardingStyles.stepTitle}>Unlock the collector&apos;s cut.</Text>
        <Text style={onboardingStyles.sectionCopy}>
          Chrono Plus turns the daily ritual into a richer archive with deeper context and a more
          premium reading path.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[theme.colors.accentPrimary, theme.colors.textPrimary]}
          start={{ x: 0.05, y: 0.1 }}
          end={{ x: 0.95, y: 0.95 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Chrono Plus</Text>
          </View>

          <Text style={styles.heroTitle}>Start with a calmer, deeper history feed.</Text>
          <Text style={styles.heroBody}>
            One subscription, curated like a museum pass: fewer interruptions, more meaning.
          </Text>

          <View pointerEvents="box-none" style={styles.heroScene}>
            <DecorativeIllustration
              source={columnIllustration}
              widthRatio={0.2}
              minWidth={76}
              maxWidth={104}
              left={-spacingScale.sm}
              bottom={0}
              opacity={0.92}
            />
            <DecorativeIllustration
              source={moonLandingIllustration}
              widthRatio={0.42}
              minWidth={164}
              maxWidth={210}
              bottom={-spacingScale.md}
              right={-spacingScale.xs}
              opacity={0.98}
            />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.featureList}>
        {FEATURE_ITEMS.map((item) => (
          <View key={item} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.accentPrimary}
            />
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plans}>
        {PLAN_OPTIONS.map((plan) => {
          const isSelected = state.selectedPaywallPlan === plan.key;

          return (
            <Pressable
              key={plan.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => handleSelectPlan(plan.key)}
              style={({ pressed }) => [
                styles.planCard,
                isSelected && styles.planCardSelected,
                pressed && styles.planCardPressed,
              ]}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                {plan.badge ? (
                  <View
                    style={[
                      styles.planBadge,
                      isSelected && styles.planBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.planBadgeText,
                        isSelected && styles.planBadgeTextSelected,
                      ]}
                    >
                      {plan.badge}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planCadence}>{plan.cadence}</Text>
              </View>

              <Text style={styles.planCaption}>{plan.caption}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handlePrimaryAction}
          style={({ pressed }) => [
            onboardingStyles.primaryButton,
            pressed && onboardingStyles.primaryButtonPressed,
          ]}
        >
          <Text style={onboardingStyles.primaryButtonText}>
            {state.selectedPaywallPlan === 'annual'
              ? 'Start 7-day free trial'
              : 'Continue with monthly'}
          </Text>
        </Pressable>

        <View style={styles.secondaryActionRow}>
          <Pressable onPress={handleSkip} style={styles.secondaryLink}>
            <Text style={styles.secondaryLinkText}>Maybe later</Text>
          </Pressable>
          <Pressable onPress={handleSkip} style={styles.secondaryLink}>
            <Text style={styles.secondaryLinkText}>Restore</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>
          Auto-renewing subscription. Cancel anytime in your store settings. Pricing is placeholder
          copy for now and can be adjusted later.
        </Text>
      </View>
    </ScrollView>
  );
};

export default StepPaywall;
