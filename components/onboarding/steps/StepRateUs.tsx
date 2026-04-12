import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

const createStyles = (theme: ThemeDefinition) => {
  const { colors, radius, spacing } = theme;

  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'space-between',
      gap: spacing.xxl,
      paddingBottom: spacing.lg,
    },
    topSection: {
      gap: spacing.lg,
    },
    eyebrow: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    eyebrowText: {
      color: colors.accentPrimary,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    scene: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingPanel: {
      width: '100%',
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      gap: spacing.lg,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 26,
      elevation: 4,
    },
    ratingPanelHeader: {
      gap: spacing.xs,
      alignItems: 'center',
    },
    ratingLabel: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
    },
    ratingHint: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    starRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    starButton: {
      flex: 1,
      minHeight: 56,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    starButtonActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    starButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    proofRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    proofChip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surfaceSubtle,
    },
    proofChipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    actions: {
      gap: spacing.md,
    },
    subcopy: {
      color: colors.textTertiary,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
    },
  });
};

const StepRateUs = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const { styles: onboardingStyles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelectRating = (ratingValue: 1 | 2 | 3 | 4 | 5) => {
    void Haptics.selectionAsync().catch(() => undefined);
    updateState({ ratingValue });
  };

  const handleContinue = () => {
    onNext();
  };

  const handleSkip = () => {
    updateState({ ratingValue: null });
    onNext();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topSection}>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>Quick Check-In</Text>
        </View>

        <View style={onboardingStyles.section}>
          <Text style={onboardingStyles.stepTitle}>How does the opening chapter feel?</Text>
          <Text style={onboardingStyles.sectionCopy}>
            Before we build the rest of your timeline, give us a quick pulse check on the first
            impression.
          </Text>
        </View>

        <View pointerEvents="box-none" style={styles.scene}>
          <View style={styles.ratingPanel}>
            <View style={styles.ratingPanelHeader}>
              <Text style={styles.ratingLabel}>Rate the mood so far</Text>
              <Text style={styles.ratingHint}>
                Your pick only helps us tune the onboarding. It will not interrupt the setup.
              </Text>
            </View>

            <View style={styles.starRow}>
              {RATING_OPTIONS.map((ratingValue) => {
                const isSelected = state.ratingValue === ratingValue;

                return (
                  <Pressable
                    key={ratingValue}
                    accessibilityLabel={`Rate ${ratingValue} stars`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleSelectRating(ratingValue)}
                    style={({ pressed }) => [
                      styles.starButton,
                      isSelected && styles.starButtonActive,
                      pressed && styles.starButtonPressed,
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? 'star' : 'star-outline'}
                      size={24}
                      color={isSelected ? theme.colors.accentPrimary : theme.colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.proofRow}>
              <View style={styles.proofChip}>
                <Text style={styles.proofChipText}>1 story a day</Text>
              </View>
              <View style={styles.proofChip}>
                <Text style={styles.proofChipText}>No noisy feed</Text>
              </View>
              <View style={styles.proofChip}>
                <Text style={styles.proofChipText}>Curated for curiosity</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            onboardingStyles.primaryButton,
            pressed && onboardingStyles.primaryButtonPressed,
          ]}
        >
          <Text style={onboardingStyles.primaryButtonText}>
            {state.ratingValue ? `Continue with ${state.ratingValue} stars` : 'Continue'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            onboardingStyles.inlineGhostButton,
            pressed && onboardingStyles.inlineGhostButtonPressed,
          ]}
        >
          <Text style={onboardingStyles.inlineGhostButtonText}>Not now</Text>
        </Pressable>

        <Text style={styles.subcopy}>You can adjust the details later. We only need the vibe.</Text>
      </View>
    </ScrollView>
  );
};

export default StepRateUs;
