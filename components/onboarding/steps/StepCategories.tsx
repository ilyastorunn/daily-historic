import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { type CategoryOption, useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import type { StepComponentProps } from '../types';
import { styles as onboardingStyles } from '../styles';

const categoryOptions: { value: CategoryOption; label: string; icon: any }[] = [
  { value: 'world-wars', label: 'World Wars', icon: require('@/assets/icons/World-Wars.png') },
  { value: 'ancient-civilizations', label: 'Ancient Civilizations', icon: require('@/assets/icons/Ancient-Civilizations.png') },
  { value: 'science-discovery', label: 'Science & Discovery', icon: require('@/assets/icons/Science-Discovery.png') },
  { value: 'inventions', label: 'Inventions', icon: require('@/assets/icons/Inventions.png') },
  { value: 'natural-disasters', label: 'Natural Disasters', icon: require('@/assets/icons/Natural-Disasters.png') },
  { value: 'art-culture', label: 'Art & Culture', icon: require('@/assets/icons/Art-Culture.png') },
  { value: 'politics', label: 'Politics', icon: require('@/assets/icons/Politics.png') },
  { value: 'civil-rights', label: 'Civil Rights', icon: require('@/assets/icons/Civil-Rights.png') },
  { value: 'exploration', label: 'Exploration', icon: require('@/assets/icons/Explorations.png') },
];

interface CategoryChipProps {
  option: { value: CategoryOption; label: string; icon: any };
  selected: boolean;
  onPress: () => void;
  themedStyles: any;
  theme: ThemeDefinition;
}

const CategoryChip = ({ option, selected, onPress, themedStyles, theme }: CategoryChipProps) => {
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
      theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.borderSubtle,
      theme.colors.accentPrimary,
    ],
  });

  return (
    <Animated.View style={{ borderColor, ...themedStyles.card }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityHint={selected ? 'Double tap to deselect' : 'Double tap to select'}
        testID={`category-card-${option.value}`}
        style={({ pressed }) => [
          themedStyles.cardInner,
          pressed && themedStyles.cardPressed,
        ]}
      >
        <Image source={option.icon} style={themedStyles.cardIcon} />
        <Text style={themedStyles.cardLabel}>{option.label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, mode } = theme;
  const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    header: {
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.6,
      color: colors.textPrimary,
      fontWeight: '400',
    },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
    card: {
      borderRadius: radius.pill,
      borderWidth: 2,
      overflow: 'hidden',
    },
    cardInner: {
      backgroundColor: mode === 'dark' ? colors.surfaceElevated : colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    cardPressed: {
      opacity: 0.7,
    },
    cardIcon: {
      width: 25,
      height: 25,
    },
    cardLabel: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '500',
      color: colors.textPrimary,
    },
  });
};

const StepCategories = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const themedStyles = useMemo(() => createStyles(theme), [theme]);

  const toggleCategory = (value: CategoryOption) => {
    if (value === 'surprise') {
      updateState({ categories: ['surprise'], categoriesSkipped: false });
      return;
    }

    const next = state.categories.includes(value)
      ? state.categories.filter((item) => item !== value)
      : [...state.categories.filter((item) => item !== 'surprise'), value];

    updateState({ categories: next, categoriesSkipped: false });
  };

  const handleSkip = () => {
    updateState({ categories: [], categoriesSkipped: true });
    onNext();
  };

  return (
    <View style={[onboardingStyles.stepScroll, themedStyles.container]}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.title}>What are your{'\n'}interests?</Text>
      </View>

      <View style={themedStyles.cardGrid}>
        {categoryOptions.map((option) => {
          const selected = state.categories.includes(option.value);
          return (
            <CategoryChip
              key={option.value}
              option={option}
              selected={selected}
              onPress={() => toggleCategory(option.value)}
              themedStyles={themedStyles}
              theme={theme}
            />
          );
        })}
      </View>
    </View>
  );
};

export default StepCategories;
