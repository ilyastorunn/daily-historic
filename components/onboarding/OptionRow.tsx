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
  onPress: () => void;
};

const OptionRow = ({ label, subcopy, selected, iconName, onPress }: OptionRowProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.socialButton,
      selected && styles.socialButtonSelected,
      pressed && styles.socialButtonPressed,
    ]}
  >
    {iconName ? (
      <View style={[styles.socialButtonIcon, selected && styles.socialButtonIconSelected]}>
        <Ionicons
          name={iconName}
          size={20}
          color={selected ? colors.surface : colors.textPrimary}
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
