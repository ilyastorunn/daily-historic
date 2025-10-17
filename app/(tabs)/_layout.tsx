import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';

const ICON_MAP: Record<string, IconSymbolName> = {
  index: 'house.fill',
  explore: 'sparkles',
  profile: 'person.crop.circle.fill',
};

function BottomDock({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { spacing, colors } = theme;
  const bottomInset = insets.bottom > spacing.sm ? insets.bottom : spacing.sm;

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const label =
            options.tabBarLabel ??
            options.title ??
            route.name.charAt(0).toUpperCase() + route.name.slice(1);
          const iconName = ICON_MAP[route.name] ?? 'house.fill';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const handlePressIn = () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : undefined}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onPressIn={handlePressIn}
              onLongPress={onLongPress}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <View style={[styles.pill, isFocused && styles.pillActive]}>
                <IconSymbol
                  name={iconName}
                  size={22}
                  color={isFocused ? colors.accentPrimary : colors.textSecondary}
                />
                <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography, mode } = theme;
  const dockBackground = mode === 'dark' ? colors.surfaceSubtle : colors.surface;
  const accentWash = mode === 'dark' ? colors.accentMuted : colors.accentSoft;
  const labelBase = typography.label;

  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: spacing.xl,
      right: spacing.xl,
      bottom: 0,
      pointerEvents: 'box-none',
    },
    dock: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: dockBackground,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.16,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        },
        default: {
          elevation: 12,
        },
      }),
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
    },
    itemPressed: {
      opacity: 0.75,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
    },
    pillActive: {
      backgroundColor: accentWash,
    },
    label: {
      marginLeft: spacing.xs,
      color: colors.textSecondary,
      fontSize: labelBase.fontSize,
      lineHeight: labelBase.lineHeight,
      fontWeight: labelBase.fontWeight,
    },
    labelActive: {
      color: colors.accentPrimary,
    },
  });
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <BottomDock {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
