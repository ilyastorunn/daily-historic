import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { GoalOption } from '@/contexts/onboarding-context';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import OptionRow from '../OptionRow';
import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

const GOAL_OPTIONS: { value: GoalOption; label: string; subcopy: string; icon: string }[] = [
  {
    value: 'learn-daily',
    label: 'Learn something new every day',
    subcopy: 'Build a daily knowledge habit',
    icon: 'book-outline',
  },
  {
    value: 'impress-friends',
    label: 'Have better stories to tell',
    subcopy: 'Drop a fascinating fact at the right moment',
    icon: 'chatbubble-outline',
  },
  {
    value: 'find-perspective',
    label: 'Find perspective on today\'s world',
    subcopy: 'See how the past shapes the present',
    icon: 'globe-outline',
  },
  {
    value: 'just-curious',
    label: 'Just curious what happened today',
    subcopy: 'Satisfy that itch to know more',
    icon: 'sparkles-outline',
  },
];

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing } = theme;

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
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.6,
      color: colors.textPrimary,
      fontWeight: '400',
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    options: {
      gap: 10,
    },
  });
};

const StepGoal = (_props: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { styles: shared } = useMemo(() => createOnboardingStyles(theme), [theme]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[shared.stackGap, { paddingBottom: theme.spacing.xl }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>What brings you to Chrono?</Text>
        <Text style={styles.subtitle}>We&apos;ll personalise your daily story around this.</Text>
      </View>

      <View style={styles.options}>
        {GOAL_OPTIONS.map((option) => (
          <OptionRow
            key={option.value}
            label={option.label}
            subcopy={option.subcopy}
            selected={state.goal === option.value}
            iconName={option.icon as any}
            variant="goal"
            onPress={() => updateState({ goal: option.value })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default StepGoal;
