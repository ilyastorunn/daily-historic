import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { useAppTheme } from '@/theme';
import { createOnboardingStyles } from './styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

type OptionRowProps = {
  label: string;
  subcopy?: string;
  selected?: boolean;
  iconName?: IconName;
  iconColor?: string;
  iconSelectedColor?: string;
  onPress: () => void;
  variant?: 'default' | 'subtle' | 'goal';
};

const OptionRow = ({
  label,
  subcopy,
  selected,
  iconName,
  iconColor,
  iconSelectedColor,
  onPress,
  variant = 'default',
}: OptionRowProps) => {
  const theme = useAppTheme();
  const { colors, styles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const resolvedIconColor = selected
    ? iconSelectedColor ?? (variant === 'goal' ? colors.accentPrimary : iconColor ?? colors.surface)
    : iconColor ?? colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialButton,
        variant === 'goal' && styles.socialButtonGoal,
        variant === 'subtle' && styles.socialButtonSubtle,
        selected && styles.socialButtonSelected,
        pressed && styles.socialButtonPressed,
      ]}
    >
      {iconName ? (
        <View
          style={[
            styles.socialButtonIcon,
            variant === 'goal' && styles.socialButtonIconGoal,
            selected && styles.socialButtonIconSelected,
            variant === 'goal' && selected && styles.socialButtonIconGoalSelected,
          ]}
        >
          <Ionicons
            name={iconName}
            size={20}
            color={resolvedIconColor}
          />
        </View>
      ) : null}

      <View style={styles.socialButtonContent}>
        <Text style={styles.socialButtonText}>{label}</Text>
        {subcopy ? <Text style={styles.socialButtonSubcopy}>{subcopy}</Text> : null}
        {selected && !subcopy ? <Text style={styles.socialButtonSubcopy}>Selected</Text> : null}
      </View>
    </Pressable>
  );
};

export default OptionRow;
