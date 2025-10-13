import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme';

type SelectableChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const AnimatedContainer = Animated.View;

export const SelectableChip: React.FC<SelectableChipProps> = ({
  label,
  selected,
  onPress,
  accessibilityHint,
  accessibilityLabel,
  style,
  testID,
}) => {
  const theme = useAppTheme();
  const { colors, radius, spacing } = theme;

  const sansFamily = useMemo(
    () => Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    []
  );

  const animatedValue = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: selected ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [animatedValue, selected]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const baseStyles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          marginRight: spacing.md,
          marginBottom: spacing.md,
        },
        pressable: {
          paddingHorizontal: spacing.card,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: 'transparent',
          backgroundColor: colors.surfaceSubtle,
          shadowColor: 'transparent',
        },
        pressableSelected: {
          backgroundColor: colors.accentPrimary,
          borderColor: colors.accentPrimary,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 18,
          elevation: 3,
        },
        pressablePressed: {
          transform: [{ scale: 0.97 }],
        },
        label: {
          color: colors.textSecondary,
          fontFamily: sansFamily,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
        labelSelected: {
          color: colors.surface,
        },
      }),
    [colors.accentPrimary, colors.shadowColor, colors.surface, colors.surfaceSubtle, colors.textSecondary, radius.pill, sansFamily, spacing.card, spacing.md, spacing.sm]
  );

  return (
    <AnimatedContainer
      style={[
        baseStyles.wrapper,
        style,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
      testID={testID}
    >
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [
          baseStyles.pressable,
          selected && baseStyles.pressableSelected,
          pressed && baseStyles.pressablePressed,
        ]}
      >
        <Text style={[baseStyles.label, selected && baseStyles.labelSelected]}>{label}</Text>
      </Pressable>
    </AnimatedContainer>
  );
};
