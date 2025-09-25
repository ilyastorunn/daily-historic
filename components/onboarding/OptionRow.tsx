import { Pressable, Text } from 'react-native';

import { styles } from './styles';

type OptionRowProps = {
  label: string;
  subcopy?: string;
  selected?: boolean;
  onPress: () => void;
};

const OptionRow = ({ label, subcopy, selected, onPress }: OptionRowProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.card,
      selected && styles.cardSelected,
      pressed && styles.cardPressed,
    ]}
  >
    <Text style={styles.cardTitle}>{label}</Text>
    {subcopy && <Text style={styles.helperText}>{subcopy}</Text>}
    {selected && <Text style={styles.cardHint}>Selected</Text>}
  </Pressable>
);

export default OptionRow;
