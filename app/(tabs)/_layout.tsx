import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';

const withOpacity = (color: string, opacity: number) => {
  if (color.startsWith('#')) {
    const normalized = color.replace('#', '');
    const bigint = Number.parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (match) {
    const [, r, g, b] = match;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
};

const createTabBarStyles = (theme: ThemeDefinition) => {
  const { colors, radius, spacing } = theme;

  return StyleSheet.create({
    tabBar: {
      position: 'absolute',
      bottom: spacing.xl,
      left: spacing.xl,
      right: spacing.xl,
      height: 72,
      maxWidth: 380,
      paddingHorizontal: spacing.md,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 20 : 14,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: withOpacity(colors.borderSubtle, 0.7),
      backgroundColor: withOpacity(colors.surface, 0.78),
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 14,
      alignSelf: 'center',
    },
    item: {
      borderRadius: radius.pill,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};

const createIconStyles = (theme: ThemeDefinition) => {
  const { colors, radius, spacing } = theme;
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    glow: {
      position: 'absolute',
      left: -spacing.sm,
      right: -spacing.sm,
      top: -spacing.sm,
      bottom: -spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.accentPrimary,
      opacity: 0.22,
      shadowColor: colors.accentPrimary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.48,
      shadowRadius: 26,
      elevation: 12,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
      backgroundColor: 'transparent',
    },
    pillActive: {
      backgroundColor: colors.accentPrimary,
    },
    label: {
      fontFamily: sansFamily,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      color: colors.textSecondary,
    },
    labelActive: {
      color: colors.surface,
    },
  });
};

type GlowTabIconProps = {
  focused: boolean;
  label: string;
  iconName: IconSymbolName;
  styles: ReturnType<typeof createIconStyles>;
  colors: ThemeDefinition['colors'];
};

const GlowTabIcon = ({ focused, label, iconName, styles, colors }: GlowTabIconProps) => {
  return (
    <View style={styles.container}>
      {focused ? <View pointerEvents="none" style={styles.glow} /> : null}
      <View style={[styles.pill, focused && styles.pillActive]}>
        <IconSymbol
          name={iconName}
          size={26}
          color={focused ? colors.surface : colors.textSecondary}
        />
        <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      </View>
    </View>
  );
};

export default function TabLayout() {
  const theme = useAppTheme();
  const tabBarStyles = useMemo(() => createTabBarStyles(theme), [theme]);
  const iconStyles = useMemo(() => createIconStyles(theme), [theme]);
  const { colors } = theme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabBarStyles.tabBar,
        tabBarItemStyle: tabBarStyles.item,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <GlowTabIcon
              focused={focused}
              label="Home"
              iconName="house.fill"
              styles={iconStyles}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <GlowTabIcon
              focused={focused}
              label="Explore"
              iconName="paperplane.fill"
              styles={iconStyles}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <GlowTabIcon
              focused={focused}
              label="Profile"
              iconName="person.crop.circle.fill"
              styles={iconStyles}
              colors={colors}
            />
          ),
        }}
      />
    </Tabs>
  );
}
