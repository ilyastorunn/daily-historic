import React, { useCallback, useMemo } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  Image,
  type ImageErrorEventData,
  type ImageLoadEventData,
  type ImageSource,
} from 'expo-image';

import { useAppTheme, type ThemeDefinition } from '@/theme';
import { getImageUri } from '@/utils/image-source';

export type EditorialCardAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

type EditorialCardProps = {
  badge: string;
  title: string;
  summary: string;
  imageSource?: ImageSource;
  meta?: string;
  actions?: EditorialCardAction[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

const OVERLAY_GRADIENT = require('@/assets/images/onboarding-overlay-gradient.png');

const createStyles = (theme: ThemeDefinition) => {
  const { colors, radius, spacing } = theme;
  const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    wrapper: {
      borderRadius: radius.card,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
      elevation: 6,
    },
    wrapperPressed: {
      transform: [{ scale: 0.98 }],
      shadowOpacity: 0.1,
    },
    mediaShell: {
      height: 220,
      overflow: 'hidden',
      backgroundColor: colors.surfaceSubtle,
    },
    media: {
      width: '100%',
      height: '100%',
    },
    overlayGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.4,
    },
    overlayTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(12, 9, 5, 0.18)',
    },
    content: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
      fontSize: 12,
      letterSpacing: 0.8,
      fontFamily: sansFamily,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.6,
      color: colors.textPrimary,
    },
    summary: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    meta: {
      fontFamily: sansFamily,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textTertiary,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      paddingTop: spacing.xs,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderWidth: 1,
    },
    actionPrimary: {
      backgroundColor: colors.accentPrimary,
      borderColor: colors.accentPrimary,
    },
    actionSecondary: {
      backgroundColor: 'transparent',
      borderColor: colors.borderSubtle,
    },
    actionLabel: {
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    actionLabelPrimary: {
      color: colors.surface,
    },
    actionLabelSecondary: {
      color: colors.textSecondary,
    },
    actionPressed: {
      opacity: 0.85,
    },
  });
};

export const EditorialCard: React.FC<EditorialCardProps> = ({
  badge,
  title,
  summary,
  imageSource,
  meta,
  actions,
  onPress,
  style,
  accessibilityLabel,
  testID,
}) => {
  const theme = useAppTheme();
  const themedStyles = useMemo(() => createStyles(theme), [theme]);
  const imageUri = useMemo(() => getImageUri(imageSource), [imageSource]);

  const handleActionPress = (callback: () => void) => (event: GestureResponderEvent) => {
    event.stopPropagation();
    callback();
  };

  const handleImageLoad = useCallback(
    (event: ImageLoadEventData) => {
      console.log('[EditorialCard] image loaded', {
        uri: imageUri,
        resolvedUrl: event.source?.url,
        cacheType: event.cacheType,
        width: event.source?.width,
        height: event.source?.height,
      });
    },
    [imageUri]
  );

  const handleImageError = useCallback(
    (event: ImageErrorEventData) => {
      console.warn('[EditorialCard] image failed to load', {
        uri: imageUri,
        error: event.error,
      });
    },
    [imageUri]
  );

  const renderActions = () => {
    if (!actions || actions.length === 0) {
      return null;
    }

    return (
      <View style={themedStyles.actions}>
        {actions.map((action, index) => {
          const variant = action.variant ?? (index === 0 ? 'primary' : 'secondary');
          return (
            <Pressable
              key={`${action.label}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={handleActionPress(action.onPress)}
              style={({ pressed }) => [
                themedStyles.actionButton,
                variant === 'primary' ? themedStyles.actionPrimary : themedStyles.actionSecondary,
                pressed && themedStyles.actionPressed,
              ]}
            >
              <Text
                style={[
                  themedStyles.actionLabel,
                  variant === 'primary'
                    ? themedStyles.actionLabelPrimary
                    : themedStyles.actionLabelSecondary,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={onPress ? 'button' : 'none'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        themedStyles.wrapper,
        style,
        pressed && onPress && themedStyles.wrapperPressed,
      ]}
      testID={testID}
    >
      {imageSource ? (
        <View style={themedStyles.mediaShell}>
          <Image
            source={imageSource}
            style={themedStyles.media}
            contentFit="cover"
            transition={150}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          <Image
            source={OVERLAY_GRADIENT}
            style={themedStyles.overlayGradient}
            contentFit="cover"
            blurRadius={5}
            recyclingKey="card-overlay"
          />
          <View style={themedStyles.overlayTint} />
        </View>
      ) : null}

      <View style={themedStyles.content}>
        <Text style={themedStyles.badge}>{badge}</Text>
        <Text style={themedStyles.title}>{title}</Text>
        <Text numberOfLines={2} style={themedStyles.summary}>
          {summary}
        </Text>
        {meta ? <Text style={themedStyles.meta}>{meta}</Text> : null}
      </View>

      {renderActions()}
    </Pressable>
  );
};
