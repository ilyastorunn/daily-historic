import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type CategoryOption, useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import type { StepComponentProps } from '../types';

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
        style={({ pressed }) => [themedStyles.cardInner, pressed && themedStyles.cardPressed]}
      >
        <View style={[themedStyles.cardIconWrap, selected && themedStyles.cardIconWrapSelected]}>
          <Image source={option.icon} style={themedStyles.cardIcon} />
        </View>
        <Text numberOfLines={2} style={[themedStyles.cardLabel, selected && themedStyles.cardLabelSelected]}>
          {option.label}
        </Text>
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
      flex: 1,
      position: 'relative',
      overflow: 'visible',
      paddingHorizontal: 20,
    },
    topContent: {
      gap: spacing.xl,
      paddingBottom: spacing.lg,
    },
    header: {
      gap: spacing.sm,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    listScroll: {
      flex: 1,
    },
    listContent: {
      paddingBottom: spacing.xl,
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
      gap: spacing.sm,
      paddingTop: spacing.md,
      alignContent: 'flex-start',
    },
    card: {
      width: '48.5%',
      borderRadius: radius.lg,
      borderWidth: 2,
      overflow: 'hidden',
    },
    cardInner: {
      backgroundColor: mode === 'dark' ? colors.surfaceElevated : colors.surface,
      minHeight: 112,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    cardPressed: {
      opacity: 0.9,
    },
    cardIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    cardIconWrapSelected: {
      borderColor: colors.accentMuted,
      backgroundColor: colors.appBackground,
    },
    cardIcon: {
      width: 24,
      height: 24,
    },
    cardLabel: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cardLabelSelected: {
      color: colors.accentPrimary,
    },
  });
};

const StepCategories = (_props: StepComponentProps) => {
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

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.title}>What are your{'\n'}interests?</Text>
      </View>

      <ScrollView
        style={themedStyles.listScroll}
        contentContainerStyle={themedStyles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={themedStyles.topContent}>
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
      </ScrollView>
    </View>
  );
};

export default StepCategories;
