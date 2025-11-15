import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { useAppTheme, type ThemeDefinition } from '@/theme';

export type TimeMachineBlockProps = {
  premium: boolean;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  onPress: () => void;
  onTeaser?: () => void;
  loading?: boolean;
  testID?: string;
};

const buildStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serif = { fontFamily: 'Times New Roman' };
  const sans = { fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) };

  return StyleSheet.create({
    container: {
      borderRadius: 20,
      overflow: 'hidden',
      height: 200,
      backgroundColor: colors.surfaceSubtle,
      elevation: 2,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.16,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    pressable: {
      flex: 1,
    },
    image: {
      flex: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(12, 10, 6, 0.40)',
      padding: spacing.xl,
      justifyContent: 'flex-end',
    },
    title: {
      ...serif,
      fontSize: typography.headingMd.fontSize + 4,
      lineHeight: typography.headingMd.lineHeight + 6,
      color: colors.surface,
      letterSpacing: -0.4,
    },
    subtitle: {
      ...sans,
      fontSize: typography.helper.fontSize,
      color: colors.surface,
      opacity: 0.85,
      marginTop: spacing.xs,
    },
    badge: {
      ...sans,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      color: colors.surface,
      fontSize: typography.helper.fontSize,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(12, 10, 6, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      ...sans,
      color: colors.surface,
      fontSize: typography.helper.fontSize,
    },
    skeletonContainer: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
      opacity: 0.65,
      padding: spacing.xl,
      justifyContent: 'flex-end',
    },
    skeletonBadge: {
      width: 80,
      height: 24,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
      marginBottom: spacing.sm,
    },
    skeletonTitle: {
      width: '60%',
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSubtle,
    },
    skeletonSubtitle: {
      width: '45%',
      height: 16,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSubtle,
      marginTop: spacing.xs,
    },
  });
};

export const TimeMachineBlock: React.FC<TimeMachineBlockProps> = ({
  premium,
  title = 'Time Machine',
  subtitle,
  imageUrl,
  onPress,
  onTeaser,
  loading,
  testID,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const handlePress = () => {
    triggerHaptic();
    if (loading) {
      return;
    }
    if (premium) {
      onPress();
      return;
    }
    if (onTeaser) {
      onTeaser();
      return;
    }
    onPress();
  };

  return (
    <View style={styles.container} testID={testID}>
      {loading ? (
        <View style={styles.skeletonContainer} pointerEvents="none">
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonTitle} />
          {subtitle ? <View style={styles.skeletonSubtitle} /> : null}
        </View>
      ) : (
        <Pressable style={styles.pressable} accessibilityRole="button" onPress={handlePress}>
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
          <View style={styles.overlay}>
            {!premium ? <Text style={styles.badge}>Premium</Text> : null}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </Pressable>
      )}
    </View>
  );
};
