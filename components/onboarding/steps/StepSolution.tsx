import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { GoalOption, PainPointOption } from '@/contexts/onboarding-context';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

type SolutionItem = {
  pain: string;
  solution: string;
  icon: string;
};

const PAIN_TO_SOLUTION: Record<PainPointOption, SolutionItem> = {
  'forget-daily': {
    pain: 'You forget to learn something daily',
    solution: 'Chrono sends one gentle reminder at exactly your preferred time — nothing more.',
    icon: 'alarm-outline',
  },
  'dry-academic': {
    pain: 'History content feels dry and academic',
    solution:
      'Every story is written like a magazine feature — vivid, human, and worth 60 seconds of your day.',
    icon: 'newspaper-outline',
  },
  'too-many-apps': {
    pain: 'Too many apps fighting for your attention',
    solution:
      'Chrono delivers one story, then closes. No infinite scroll. No algorithm trying to keep you hooked.',
    icon: 'shield-checkmark-outline',
  },
  'dont-know-where-to-start': {
    pain: "You never know where to start",
    solution:
      'We pick the story every day. You just open, read, and walk away a little more curious.',
    icon: 'compass-outline',
  },
  'no-continuity': {
    pain: 'You read random stuff with no continuity',
    solution:
      'Your timeline builds day by day — categories and eras you care about, not random internet noise.',
    icon: 'layers-outline',
  },
};

const GOAL_HERO_COPY: Record<GoalOption, string> = {
  'learn-daily': 'You\'re building a habit that actually sticks.',
  'impress-friends': 'You\'ll be the most interesting person at the table.',
  'find-perspective': 'History will help you make sense of today.',
  'just-curious': 'Your curiosity is about to be very well fed.',
};

const DEFAULT_SOLUTIONS: SolutionItem[] = [
  PAIN_TO_SOLUTION['forget-daily'],
  PAIN_TO_SOLUTION['dry-academic'],
  PAIN_TO_SOLUTION['too-many-apps'],
];

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 0,
    },
    header: {
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.6,
      color: colors.textPrimary,
      fontWeight: '400',
    },
    heroLine: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    solutionList: {
      gap: spacing.md,
    },
    solutionCard: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: spacing.lg,
      minHeight: 118,
      gap: spacing.sm,
      flexDirection: 'row',
      alignItems: 'flex-start',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    painText: {
      fontFamily: sansFamily,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textTertiary,
      fontStyle: 'italic',
    },
    solutionText: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textPrimary,
      fontWeight: '500',
    },
  });
};

const StepSolution = (_props: StepComponentProps) => {
  const { state } = useOnboardingContext();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { styles: shared } = useMemo(() => createOnboardingStyles(theme), [theme]);

  const solutionItems = useMemo((): SolutionItem[] => {
    if (state.painPoints.length === 0) return DEFAULT_SOLUTIONS;
    return state.painPoints
      .slice(0, 4)
      .map((p) => PAIN_TO_SOLUTION[p])
      .filter(Boolean);
  }, [state.painPoints]);

  const goalLine =
    state.goal ? GOAL_HERO_COPY[state.goal] : 'Your personal history ritual starts here.';

  const firstName = state.displayName.trim().split(' ')[0] || '';
  const titleLine = firstName
    ? `${firstName}, your plan is ready.`
    : 'Your plan is ready.';

  const likedCount = state.tinderLikes.length;
  const heroLine = likedCount > 0
    ? `You loved ${likedCount} moment${likedCount !== 1 ? 's' : ''} in the swipe — they'll seed your first feed. ${goalLine}`
    : goalLine;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[shared.stackGap, { paddingBottom: theme.spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{titleLine}</Text>
        <Text style={styles.heroLine}>{heroLine}</Text>
      </View>

      <View style={styles.solutionList}>
        {solutionItems.map((item) => (
          <View key={item.pain} style={styles.solutionCard}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon as any} size={20} color={theme.colors.accentPrimary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.painText}>{item.pain}</Text>
              <Text style={styles.solutionText}>{item.solution}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default StepSolution;
