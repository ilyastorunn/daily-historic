import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useUserContext } from '@/contexts/user-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

const ICON_MAP: Record<string, IconSymbolName> = {
  index: 'house.fill',
  explore: 'sparkles',
  profile: 'person.crop.circle.fill',
};

const AnimatedText = Animated.createAnimatedComponent(Text);

type DockTabItemProps = {
  index: number;
  isFocused: boolean;
  label: string;
  iconName: IconSymbolName;
  totalRoutes: number;
  activeIndex: Animated.SharedValue<number>;
  colors: ThemeDefinition['colors'];
  onPress: () => void;
  onLongPress: () => void;
  onPressIn: () => void;
  styles: ReturnType<typeof createStyles>;
};

function DockTabItem({
  index,
  isFocused,
  label,
  iconName,
  totalRoutes,
  activeIndex,
  colors,
  onPress,
  onLongPress,
  onPressIn,
  styles,
}: DockTabItemProps) {
  const activeLayerStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndex.value - index);

    return {
      opacity: interpolate(distance, [0, 0.75, 1], [1, 0.2, 0], Extrapolation.CLAMP),
    };
  }, [index]);

  const inactiveLayerStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndex.value - index);

    return {
      opacity: interpolate(distance, [0, 0.75, 1], [0, 0.8, 1], Extrapolation.CLAMP),
    };
  }, [index]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : undefined}
      accessibilityLabel={`${label}, tab ${index + 1} of ${totalRoutes}${isFocused ? ', selected' : ''}`}
      onPress={onPress}
      onPressIn={onPressIn}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View style={styles.itemChrome}>
        <View style={styles.iconPlate}>
          <Animated.View style={[styles.iconLayer, inactiveLayerStyle]}>
            <IconSymbol name={iconName} size={20} color={colors.textSecondary} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, activeLayerStyle]}>
            <IconSymbol name={iconName} size={20} color={colors.accentPrimary} />
          </Animated.View>
        </View>

        <View style={styles.labelSlot}>
          <AnimatedText style={[styles.label, styles.labelInactive, inactiveLayerStyle]}>
            {label}
          </AnimatedText>
          <AnimatedText style={[styles.label, styles.labelActive, activeLayerStyle]}>
            {label}
          </AnimatedText>
        </View>
      </View>
    </Pressable>
  );
}

function BottomDock({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { spacing, colors, mode } = theme;
  const bottomInset = Math.max(insets.bottom - spacing.lg, spacing.xs);
  const blurTint = mode === 'dark' ? 'dark' : 'light';
  const islandWidth = Math.min(windowWidth - spacing.card * 2, 316);
  const routeCount = state.routes.length;
  const horizontalPadding = spacing.xs + 2;
  const verticalPadding = spacing.xs + 2;
  const itemGap = spacing.xs;
  const itemWidth =
    (islandWidth - horizontalPadding * 2 - itemGap * Math.max(routeCount - 1, 0)) / routeCount;
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 22,
      stiffness: 140,
      mass: 1.05,
    });
  }, [activeIndex, state.index]);

  const activeIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: activeIndex.value * (itemWidth + itemGap),
        },
      ],
    };
  }, [activeIndex, itemGap, itemWidth]);

  return (
    <View pointerEvents="box-none" style={[styles.outerContainer, { paddingBottom: bottomInset }]}>
      <View style={[styles.islandShadow, { width: islandWidth }]}>
        <View style={styles.islandShell}>
          <BlurView
            tint={blurTint}
            intensity={58}
            blurReductionFactor={3}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.surfaceTint} pointerEvents="none" />
          <View style={styles.topSheen} pointerEvents="none" />

          <View style={styles.contentWrapper}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.activeIndicator,
                {
                  left: horizontalPadding,
                  top: verticalPadding,
                  width: itemWidth,
                },
                activeIndicatorStyle,
              ]}
            />
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const descriptor = descriptors[route.key];
              const options = descriptor.options;
              const fallbackLabel =
                options.title ?? route.name.charAt(0).toUpperCase() + route.name.slice(1);
              const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : fallbackLabel;
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
                <DockTabItem
                  key={route.key}
                  index={index}
                  isFocused={isFocused}
                  label={label}
                  iconName={iconName}
                  totalRoutes={state.routes.length}
                  activeIndex={activeIndex}
                  colors={colors}
                  onPress={onPress}
                  onPressIn={handlePressIn}
                  onLongPress={onLongPress}
                  styles={styles}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, mode } = theme;
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    outerContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.xl,
      paddingTop: 0,
      backgroundColor: 'transparent',
      alignItems: 'center',
      zIndex: 20,
    },
    islandShadow: {
      borderRadius: 28,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: mode === 'dark' ? 0.34 : 0.16,
      shadowRadius: 28,
      elevation: 14,
    },
    islandShell: {
      overflow: 'hidden',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)',
      backgroundColor: mode === 'dark' ? 'rgba(33, 30, 24, 0.44)' : 'rgba(255, 251, 244, 0.46)',
    },
    surfaceTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: mode === 'dark' ? 'rgba(15, 13, 10, 0.18)' : 'rgba(255, 247, 238, 0.18)',
    },
    topSheen: {
      position: 'absolute',
      top: 0,
      left: 18,
      right: 18,
      height: 1,
      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.92)',
    },
    contentWrapper: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: spacing.xs + 2,
    },
    activeIndicator: {
      position: 'absolute',
      bottom: spacing.xs + 2,
      minHeight: 52,
      borderRadius: 22,
      backgroundColor: mode === 'dark' ? 'rgba(14, 13, 10, 0.18)' : 'rgba(255, 255, 255, 0.42)',
      borderWidth: 1,
      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.62)',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: mode === 'dark' ? 0.2 : 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
    item: {
      flex: 1,
      minWidth: 0,
      borderRadius: 22,
    },
    itemChrome: {
      minHeight: 52,
      paddingHorizontal: spacing.xs + 2,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    itemPressed: {
      transform: [{ scale: 0.98 }],
    },
    iconPlate: {
      position: 'relative',
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLayer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelSlot: {
      position: 'relative',
      minWidth: 58,
      minHeight: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      position: 'absolute',
      fontSize: 11,
      lineHeight: 13,
      letterSpacing: 0.08,
      fontFamily: sansFamily,
      textAlign: 'center',
    },
    labelInactive: {
      fontWeight: '500',
      color: colors.textSecondary,
    },
    labelActive: {
      fontWeight: '600',
      color: colors.accentPrimary,
    },
  });
};

export default function TabLayout() {
  const { initializing, onboardingCompleted } = useUserContext();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

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
