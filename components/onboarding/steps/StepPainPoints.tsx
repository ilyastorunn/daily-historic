import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PainPointOption } from '@/contexts/onboarding-context';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

const PAIN_POINT_OPTIONS: { value: PainPointOption; label: string; icon: string }[] = [
  {
    value: 'forget-daily',
    label: 'I forget to learn something daily',
    icon: 'alarm-outline',
  },
  {
    value: 'dry-academic',
    label: 'History content feels dry and academic',
    icon: 'book-outline',
  },
  {
    value: 'too-many-apps',
    label: 'Too many apps fighting for my attention',
    icon: 'notifications-off-outline',
  },
  {
    value: 'dont-know-where-to-start',
    label: 'I never know where to start',
    icon: 'map-outline',
  },
  {
    value: 'no-continuity',
    label: 'I read random stuff with no continuity',
    icon: 'shuffle-outline',
  },
];

interface PainChipProps {
  option: { value: PainPointOption; label: string; icon: string };
  selected: boolean;
  onPress: () => void;
  theme: ThemeDefinition;
  themedStyles: ReturnType<typeof createStyles>;
}

const PainChip = ({ option, selected, onPress, theme, themedStyles }: PainChipProps) => {
  const animatedBorderColor = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedBorderColor, {
      toValue: selected ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [selected, animatedBorderColor]);

  const borderColor = animatedBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.colors.borderSubtle,
      theme.colors.accentPrimary,
    ],
  });

  return (
    <Animated.View style={[themedStyles.chip, { borderColor }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        style={({ pressed }) => [
          themedStyles.chipInner,
          selected && themedStyles.chipInnerSelected,
          pressed && themedStyles.chipPressed,
        ]}
      >
        <View style={[themedStyles.iconWrap, selected && themedStyles.iconWrapSelected]}>
          <Ionicons
            name={option.icon as any}
            size={20}
            color={selected ? theme.colors.accentPrimary : theme.colors.textSecondary}
          />
        </View>
        <Text style={[themedStyles.chipLabel, selected && themedStyles.chipLabelSelected]}>
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, mode } = theme;

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
    list: {
      gap: spacing.sm,
    },
    chip: {
      borderRadius: radius.lg,
      borderWidth: 2,
      overflow: 'hidden',
    },
    chipInner: {
      backgroundColor: mode === 'dark' ? colors.surfaceElevated : colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
      minHeight: 68,
    },
    chipInnerSelected: {
      backgroundColor: colors.accentSoft,
    },
    chipPressed: {
      opacity: 0.85,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    iconWrapSelected: {
      backgroundColor: colors.appBackground,
      borderColor: colors.accentMuted,
    },
    chipLabel: {
      fontFamily: sansFamily,
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    chipLabelSelected: {
      color: colors.accentPrimary,
    },
  });
};

const StepPainPoints = (_props: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const themedStyles = useMemo(() => createStyles(theme), [theme]);
  const { styles: shared } = useMemo(() => createOnboardingStyles(theme), [theme]);

  const togglePain = (value: PainPointOption) => {
    const next = state.painPoints.includes(value)
      ? state.painPoints.filter((p) => p !== value)
      : [...state.painPoints, value];
    updateState({ painPoints: next });
  };

  return (
    <ScrollView
      style={themedStyles.container}
      contentContainerStyle={[shared.stackGap, { paddingBottom: theme.spacing.xl }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={themedStyles.header}>
        <Text style={themedStyles.title}>What gets in the way?</Text>
        <Text style={themedStyles.subtitle}>
          Pick everything that feels true. We&apos;ll tackle it together.
        </Text>
      </View>

      <View style={themedStyles.list}>
        {PAIN_POINT_OPTIONS.map((option) => (
          <PainChip
            key={option.value}
            option={option}
            selected={state.painPoints.includes(option.value)}
            onPress={() => togglePain(option.value)}
            theme={theme}
            themedStyles={themedStyles}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default StepPainPoints;
