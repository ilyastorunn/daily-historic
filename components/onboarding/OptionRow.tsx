import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { colors, styles } from './styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

type OptionRowProps = {
  label: string;
  subcopy?: string;
  selected?: boolean;
  iconName?: IconName;
  iconColor?: string;
  iconSelectedColor?: string;
  onPress: () => void;
  variant?: 'default' | 'subtle';
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
}: OptionRowProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.socialButton,
      variant === 'subtle' && styles.socialButtonSubtle,
      selected && styles.socialButtonSelected,
      pressed && styles.socialButtonPressed,
    ]}
  >
    {iconName ? (
      <View style={[styles.socialButtonIcon, selected && styles.socialButtonIconSelected]}>
        <Ionicons
          name={iconName}
          size={20}
          color={
            selected
              ? iconSelectedColor ?? iconColor ?? colors.surface
              : iconColor ?? colors.textPrimary
          }
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

export default OptionRow;
