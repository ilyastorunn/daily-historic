import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { type CategoryOption, useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import DecorativeIllustration from '../DecorativeIllustration';
import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

const frenchRevolutionIllustration = require('@/assets/illustrations/FrenchRevolution.png');

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

interface CategoriesContinueButtonProps {
  disabled: boolean;
  onPress: () => void;
  buttonStyles: any;
  themedStyles: any;
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

const CategoriesContinueButton = ({
  disabled,
  onPress,
  buttonStyles,
  themedStyles,
}: CategoriesContinueButtonProps) => {
  return (
    <View style={themedStyles.ctaSection}>
      <View style={themedStyles.ctaFamily}>
        <View pointerEvents="none" style={themedStyles.ctaIllustration}>
          <DecorativeIllustration
            source={frenchRevolutionIllustration}
            widthRatio={0.2}
            minWidth={82}
            maxWidth={96}
            style={themedStyles.ctaIllustrationImage}
          />
        </View>

        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            buttonStyles.primaryButton,
            themedStyles.fullWidthButton,
            disabled && buttonStyles.primaryButtonDisabled,
            pressed && !disabled && buttonStyles.primaryButtonPressed,
          ]}
        >
          <Text
            style={[
              buttonStyles.primaryButtonText,
              disabled && buttonStyles.primaryButtonTextDisabled,
            ]}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
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
    contentArea: {
      flex: 1,
      paddingBottom: spacing.lg,
    },
    topContent: {
      gap: spacing.xl,
      flexShrink: 1,
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
    ctaSection: {
      width: '100%',
      marginTop: 'auto',
    },
    ctaFamily: {
      width: '100%',
      position: 'relative',
      paddingTop: 66,
    },
    ctaIllustration: {
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      overflow: 'visible',
    },
    ctaIllustrationImage: {
      marginBottom: -12,
    },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingTop: spacing.md,
      alignContent: 'flex-start',
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
    fullWidthButton: {
      flex: 0,
      width: '100%',
    },
  });
};

const StepCategories = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const themedStyles = useMemo(() => createStyles(theme), [theme]);
  const { styles: onboardingStyles } = useMemo(() => createOnboardingStyles(theme), [theme]);

  const isNextDisabled = !(state.categories.includes('surprise') || state.categories.length >= 1);

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
      <View style={themedStyles.contentArea}>
        <View style={themedStyles.topContent}>
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
        <CategoriesContinueButton
          buttonStyles={onboardingStyles}
          disabled={isNextDisabled}
          onPress={onNext}
          themedStyles={themedStyles}
        />
      </View>
    </View>
  );
};

export default StepCategories;
