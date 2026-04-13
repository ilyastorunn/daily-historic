import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { useAppTheme } from '@/theme';

const BLUR_MAX_INTENSITY = 42;

export type ProgressiveBlurHeaderProps = {
  scrollY: SharedValue<number>;
  topInset: number;
  testID?: string;
};

export const ProgressiveBlurHeader: React.FC<ProgressiveBlurHeaderProps> = ({
  scrollY,
  topInset,
  testID,
}) => {
  const theme = useAppTheme();
  const isIOS = Platform.OS === 'ios';

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 84], [0, 1], Extrapolation.CLAMP),
  }));

  const blurLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 96], [0, 1], Extrapolation.CLAMP),
  }));

  if (!isIOS) {
    return null;
  }

  const safeAreaHeight = Math.max(topInset, 0);

  if (safeAreaHeight <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.overlay, { height: safeAreaHeight }]} testID={testID}>
      <Animated.View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, blurLayerStyle]}>
          <BlurView
            intensity={BLUR_MAX_INTENSITY}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, sheetStyle]}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              theme.mode === 'dark' ? 'rgba(14,14,14,0.24)' : 'rgba(250,247,241,0.34)',
              theme.mode === 'dark' ? 'rgba(14,14,14,0.58)' : 'rgba(250,247,241,0.68)',
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
});
