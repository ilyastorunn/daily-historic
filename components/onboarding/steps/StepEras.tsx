import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { type EraOption, useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import type { StepComponentProps } from '../types';
import { styles as onboardingStyles } from '../styles';

const options: { value: EraOption; label: string; icon: any }[] = [
  { value: 'prehistory', label: 'Prehistory', icon: require('@/assets/icons/Prehistory.png') },
  { value: 'ancient', label: 'Ancient Worlds', icon: require('@/assets/icons/Ancient-Worlds.png') },
  { value: 'medieval', label: 'Medieval', icon: require('@/assets/icons/Medieval.png') },
  { value: 'early-modern', label: 'Early Modern', icon: require('@/assets/icons/Early-Modern.png') },
  { value: 'nineteenth', label: '19th Century', icon: require('@/assets/icons/19th-Century.png') },
  { value: 'twentieth', label: '20th Century', icon: require('@/assets/icons/20th-Century.png') },
  { value: 'contemporary', label: 'Contemporary', icon: require('@/assets/icons/Contemporary.png') },
];

interface EraChipProps {
  option: { value: EraOption; label: string; icon: any };
  selected: boolean;
  onPress: () => void;
  themedStyles: any;
  theme: ThemeDefinition;
}

const EraChip = ({ option, selected, onPress, themedStyles, theme }: EraChipProps) => {
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
        testID={`era-card-${option.value}`}
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
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl,
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

const StepEras = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const themedStyles = useMemo(() => createStyles(theme), [theme]);
  const eras = state.eras;

  const toggleOption = (option: EraOption) => {
    const next = eras.includes(option)
      ? eras.filter((item) => item !== option)
      : [...eras, option];

    updateState({ eras: next });
  };

  return (
    <View style={[onboardingStyles.stepScroll, themedStyles.container]}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.title}>Which eras do you{'\n'}prefer?</Text>
      </View>

      <View style={themedStyles.cardGrid}>
        {options.map((option) => {
          const selected = eras.includes(option.value);
          return (
            <EraChip
              key={option.value}
              option={option}
              selected={selected}
              onPress={() => toggleOption(option.value)}
              themedStyles={themedStyles}
              theme={theme}
            />
          );
        })}
      </View>
    </View>
  );
};

export default StepEras;
