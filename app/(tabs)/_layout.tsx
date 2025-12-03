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
  const { spacing, colors, mode } = theme;
  const bottomInset = Math.max(insets.bottom, spacing.sm);

  return (
    <View style={[styles.blurContainer, { paddingBottom: bottomInset }]}>
      <View style={styles.contentWrapper}>
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
              accessibilityLabel={`${label}, tab ${index + 1} of ${state.routes.length}${isFocused ? ', selected' : ''}`}
              testID={options.tabBarTestID}
              onPress={onPress}
              onPressIn={handlePressIn}
              onLongPress={onLongPress}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              {/* Icon and label - vertical stack */}
              <View style={styles.itemContent}>
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
  const { colors, spacing, mode } = theme;
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    // Container with 24pt radius and translucent background
    blurContainer: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      backgroundColor:
        mode === 'dark' ? 'rgba(27, 24, 19, 0.95)' : 'rgba(247, 244, 238, 0.95)',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    // Content wrapper with horizontal padding
    contentWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs, // Minimal top padding (4pt)
    },
    // Individual tab item
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
    },
    itemPressed: {
      opacity: 0.75,
    },
    // Vertical stack for icon and label
    itemContent: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    },
    // Label - compact typography (11pt)
    label: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '500',
      letterSpacing: -0.1,
      color: colors.textSecondary,
      fontFamily: sansFamily,
    },
    labelActive: {
      fontWeight: '600',
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
