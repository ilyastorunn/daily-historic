import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type ThemeDefinition } from '@/theme';

export type HomeChip = {
  id: string;
  label: string;
  pinned?: boolean;
};

type CategoryChipRailProps = {
  chips: HomeChip[];
  selectedId: string | null;
  loading?: boolean;
  onSelect: (chipId: string) => void;
  onPin?: (chipId: string, pinned: boolean) => void;
  testID?: string;
};

const buildStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const sans = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    scroll: {
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      marginRight: spacing.sm,
    },
    chipSelected: {
      backgroundColor: colors.accentPrimary,
      borderColor: colors.accentPrimary,
    },
    chipLabel: {
      fontFamily: sans,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    chipLabelSelected: {
      color: colors.surface,
      fontWeight: '600',
    },
    pinIndicator: {
      fontSize: 12,
      marginLeft: spacing.xs,
    },
    skeletonChip: {
      width: 80,
      height: 32,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
      marginRight: spacing.sm,
    },
  });
};

export const CategoryChipRail: React.FC<CategoryChipRailProps> = ({
  chips,
  selectedId,
  loading,
  onSelect,
  onPin,
  testID,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const skeletons = useMemo(() => Array.from({ length: 4 }), []);

  const handleLongPress = (chip: HomeChip) => {
    if (!onPin) {
      return;
    }
    onPin(chip.id, !chip.pinned);
  };

  return (
    <View style={styles.container} testID={testID}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading
          ? skeletons.map((_, index) => <View key={`chip-skeleton-${index}`} style={styles.skeletonChip} />)
          : chips.map((chip) => {
              const isSelected = chip.id === selectedId;
              return (
                <Pressable
                  key={chip.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => onSelect(chip.id)}
                  onLongPress={() => handleLongPress(chip)}
                  hitSlop={8}
                >
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{chip.label}</Text>
                  {chip.pinned ? <Text style={styles.pinIndicator}>★</Text> : null}
                </Pressable>
              );
            })}
      </ScrollView>
    </View>
  );
};
