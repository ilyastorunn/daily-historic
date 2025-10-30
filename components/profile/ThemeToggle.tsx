import React from 'react';
import { View, StyleSheet } from 'react-native';

import { SelectableChip } from '@/components/ui/selectable-chip';
import { useAppTheme } from '@/theme';
import { trackEvent } from '@/services/analytics';

type ThemePreference = 'light' | 'dark' | 'system';

type ThemeToggleProps = {
  value: ThemePreference;
  onChange: (preference: ThemePreference) => void;
};

const THEME_OPTIONS: { value: ThemePreference; label: string; accessibilityHint: string }[] = [
  {
    value: 'light',
    label: 'Light',
    accessibilityHint: 'Always use light theme',
  },
  {
    value: 'dark',
    label: 'Dark',
    accessibilityHint: 'Always use dark theme',
  },
  {
    value: 'system',
    label: 'System',
    accessibilityHint: 'Follow device theme setting',
  },
];

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ value, onChange }) => {
  const theme = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });

  const handleThemeChange = (preference: ThemePreference) => {
    trackEvent('theme_changed', {
      from: value,
      to: preference,
    });
    onChange(preference);
  };

  return (
    <View style={styles.container}>
      {THEME_OPTIONS.map((option) => (
        <SelectableChip
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => handleThemeChange(option.value)}
          accessibilityLabel={`${option.label} theme`}
          accessibilityHint={option.accessibilityHint}
        />
      ))}
    </View>
  );
};
