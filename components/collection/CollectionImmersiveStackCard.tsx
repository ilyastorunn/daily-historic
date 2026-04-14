import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Image } from 'expo-image';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';
import { categoryLabelFromId } from '@/utils/categories';
import { createLinearGradientSource } from '@/utils/gradient';
import { createImageSource } from '@/utils/wikimedia-image-source';

type CollectionImmersiveStackCardProps = {
  id: string;
  title: string;
  summary: string;
  year?: string;
  imageUrl?: string;
  categoryId?: string;
  isActive: boolean;
  onPress?: (id: string) => void;
};

export const COLLECTION_STACK_CARD_HEIGHT = 236;

export const CollectionImmersiveStackCard = memo(
  ({ id, title, summary, year, imageUrl, categoryId, isActive, onPress }: CollectionImmersiveStackCardProps) => {
    const theme = useAppTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);
    const emphasis = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    const gradientOverlay = useMemo(
      () =>
        createLinearGradientSource(
          [
            { offset: 0, color: 'rgba(12, 10, 6, 0.08)' },
            { offset: 55, color: 'rgba(12, 10, 6, 0.3)' },
            { offset: 100, color: 'rgba(12, 10, 6, 0.86)' },
          ],
          { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
        ),
      []
    );

    useEffect(() => {
      Animated.spring(emphasis, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        friction: 10,
        tension: 80,
      }).start();
    }, [emphasis, isActive]);

    const animatedCardStyle = {
      transform: [
        {
          scale: emphasis.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
        {
          translateY: emphasis.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
        },
      ],
      opacity: emphasis.interpolate({
        inputRange: [0, 1],
        outputRange: [0.74, 1],
      }),
    };

    return (
      <Animated.View style={[styles.cardWrap, animatedCardStyle]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onPress?.(id)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
        >
          {imageUrl ? (
            <Image source={createImageSource(imageUrl)} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imageFallback} />
          )}
          <Image pointerEvents="none" source={gradientOverlay} style={styles.gradientOverlay} contentFit="cover" />

          <View style={styles.content}>
            {year ? (
              <View style={styles.yearBadge}>
                <Text style={styles.yearText}>{year}</Text>
              </View>
            ) : null}

            <Text style={styles.title} numberOfLines={isActive ? 2 : 3}>
              {title}
            </Text>

            {isActive ? (
              <>
                <Text style={styles.summary} numberOfLines={2}>
                  {summary}
                </Text>
                {categoryId ? (
                  <Text style={styles.category} numberOfLines={1}>
                    {categoryLabelFromId(categoryId)}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

CollectionImmersiveStackCard.displayName = 'CollectionImmersiveStackCard';

const buildStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });

  return StyleSheet.create({
    cardWrap: {
      height: '100%',
    },
    card: {
      flex: 1,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.18)',
      backgroundColor: theme.colors.surfaceSubtle,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 5,
    },
    image: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surfaceSubtle,
    },
    imageFallback: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surfaceSubtle,
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    yearBadge: {
      alignSelf: 'flex-start',
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.46)',
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    yearText: {
      fontFamily: sansFamily,
      fontSize: 11,
      lineHeight: 14,
      color: '#FFFFFF',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 34,
      lineHeight: 38,
      color: '#FFFFFF',
      fontWeight: '600',
      textShadowColor: 'rgba(0,0,0,0.38)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    summary: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 19,
      color: 'rgba(255,255,255,0.93)',
    },
    category: {
      marginTop: 2,
      fontFamily: sansFamily,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.38,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.86)',
    },
  });
};
