import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EVENT_LIBRARY } from '@/constants/events';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 340;
const SWIPE_THRESHOLD = 100;

// Curated diverse set — 3+ categories, 3+ eras
const TINDER_EVENT_IDS = [
  'apollo-11-first-footsteps',
  'rosa-parks-bus-boycott',
  'first-iphone',
  'd-day-normandy-landing',
  'sistine-chapel-ceiling',
  'salk-polio-vaccine',
];

const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
    },
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.xs,
      alignSelf: 'stretch',
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.6,
      color: colors.textPrimary,
      fontWeight: '400',
    },
    subtitle: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    stackArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      position: 'absolute',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: radius.xl,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      padding: spacing.lg,
      gap: spacing.xs,
    },
    cardBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginBottom: spacing.xs,
    },
    cardBadgeText: {
      fontFamily: sansFamily,
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 0.4,
    },
    cardTitle: {
      fontFamily: serifFamily,
      fontSize: 20,
      lineHeight: 26,
      color: '#fff',
      fontWeight: '400',
    },
    cardMeta: {
      fontFamily: sansFamily,
      fontSize: 13,
      color: 'rgba(255,255,255,0.72)',
    },
    likeOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radius.xl,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      padding: spacing.xl,
      borderWidth: 3,
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76,175,80,0.12)',
    },
    nopeOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radius.xl,
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      padding: spacing.xl,
      borderWidth: 3,
      borderColor: '#f44336',
      backgroundColor: 'rgba(244,67,54,0.12)',
    },
    overlayLabel: {
      fontFamily: sansFamily,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#4CAF50',
      borderWidth: 2,
      borderColor: '#4CAF50',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    overlayLabelNope: {
      color: '#f44336',
      borderColor: '#f44336',
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      paddingTop: spacing.md,
      alignSelf: 'stretch',
      alignItems: 'center',
      gap: spacing.md,
    },
    hintRow: {
      flexDirection: 'row',
      gap: spacing.xl,
      alignItems: 'center',
    },
    hintItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    hintText: {
      fontFamily: sansFamily,
      fontSize: 13,
      color: colors.textTertiary,
    },
    countText: {
      fontFamily: sansFamily,
      fontSize: 13,
      color: colors.textSecondary,
    },
    skipButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    skipText: {
      fontFamily: sansFamily,
      fontSize: 14,
      color: colors.textTertiary,
    },
  });
};

// Individual swipeable card
interface SwipeCardProps {
  event: typeof EVENT_LIBRARY[number];
  isTop: boolean;
  stackIndex: number;
  onSwipe: (eventId: string, liked: boolean) => void;
  styles: ReturnType<typeof createStyles>;
  theme: ThemeDefinition;
}

const SwipeCard = ({ event, isTop, stackIndex, onSwipe, styles, theme }: SwipeCardProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isSwipedOff = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.25;
    })
    .onEnd((e) => {
      if (isSwipedOff.value) return;
      const liked = e.translationX > SWIPE_THRESHOLD;
      const disliked = e.translationX < -SWIPE_THRESHOLD;

      if (liked || disliked) {
        isSwipedOff.value = true;
        const direction = liked ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.4, { duration: 280 });
        runOnJS(onSwipe)(event.id, liked);
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 180 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 180 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10]
    );
    const scale = interpolate(stackIndex, [0, 1, 2], [1, 0.95, 0.9]);
    const yOffset = interpolate(stackIndex, [0, 1, 2], [0, 8, 16]);

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + yOffset },
        { rotate: `${rotate}deg` },
        { scale: isTop ? 1 : scale },
      ],
      zIndex: 10 - stackIndex,
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.5], [0, 1]),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD * 0.5], [0, 1]),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        {event.image ? (
          <Animated.Image
            source={event.image as any}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: theme.colors.surfaceElevated }]} />
        )}

        {/* Gradient overlay for text readability */}
        <View
          style={[styles.cardOverlay, { backgroundColor: 'transparent' }]}
          pointerEvents="none"
        >
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{event.year}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>{event.location}</Text>
        </View>

        {/* Like overlay */}
        <Animated.View style={[styles.likeOverlay, likeOpacity]} pointerEvents="none">
          <Text style={styles.overlayLabel}>LOVE IT</Text>
        </Animated.View>

        {/* Nope overlay */}
        <Animated.View style={[styles.nopeOverlay, nopeOpacity]} pointerEvents="none">
          <Text style={[styles.overlayLabel, styles.overlayLabelNope]}>MEH</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const StepTinderCards = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { styles: shared } = useMemo(() => createOnboardingStyles(theme), [theme]);

  const events = useMemo(
    () => TINDER_EVENT_IDS.map((id) => EVENT_LIBRARY.find((e) => e.id === id)).filter(Boolean) as typeof EVENT_LIBRARY,
    []
  );

  const [remainingIds, setRemainingIds] = useState<string[]>(TINDER_EVENT_IDS);
  const swipedCount = TINDER_EVENT_IDS.length - remainingIds.length;
  const canAdvance = swipedCount >= 3;

  const handleSwipe = useCallback(
    (eventId: string, liked: boolean) => {
      const tinderLikes = liked
        ? [...state.tinderLikes, eventId]
        : state.tinderLikes;
      const tinderDismissals = !liked
        ? [...state.tinderDismissals, eventId]
        : state.tinderDismissals;

      updateState({ tinderLikes, tinderDismissals });

      setRemainingIds((prev) => {
        const next = prev.filter((id) => id !== eventId);
        if (next.length === 0) {
          // All swiped — auto advance
          setTimeout(onNext, 350);
        }
        return next;
      });
    },
    [state.tinderLikes, state.tinderDismissals, updateState, onNext]
  );

  // Visible stack: top 3 remaining cards
  const visibleStack = useMemo(
    () => remainingIds.slice(0, 3).map((id) => events.find((e) => e.id === id)).filter(Boolean) as typeof events,
    [remainingIds, events]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Swipe through history</Text>
        <Text style={styles.subtitle}>
          Swipe right on moments that fascinate you. Left on ones that don&apos;t.
        </Text>
      </View>

      <View style={styles.stackArea}>
        {visibleStack.length === 0 ? (
          <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
            <Ionicons name="checkmark-circle" size={56} color={theme.colors.accentPrimary} />
            <Text style={[shared.stepTitle, { textAlign: 'center' }]}>All done!</Text>
          </View>
        ) : (
          [...visibleStack].reverse().map((event, reversedIndex) => {
            const stackIndex = visibleStack.length - 1 - reversedIndex;
            return (
              <SwipeCard
                key={event.id}
                event={event}
                isTop={stackIndex === 0}
                stackIndex={stackIndex}
                onSwipe={handleSwipe}
                styles={styles}
                theme={theme}
              />
            );
          })
        )}
      </View>

      <View style={styles.footer}>
        {remainingIds.length > 0 ? (
          <View style={styles.hintRow}>
            <View style={styles.hintItem}>
              <Ionicons name="heart-outline" size={16} color="#4CAF50" />
              <Text style={styles.hintText}>Swipe right to love it</Text>
            </View>
            <View style={styles.hintItem}>
              <Ionicons name="close-outline" size={16} color="#f44336" />
              <Text style={styles.hintText}>Left to skip</Text>
            </View>
          </View>
        ) : null}

        {canAdvance && remainingIds.length > 0 ? (
          <Pressable
            onPress={onNext}
            style={({ pressed }) => [
              shared.primaryButton,
              { flex: 0, width: '100%' },
              pressed && shared.primaryButtonPressed,
            ]}
          >
            <Text style={shared.primaryButtonText}>See my results →</Text>
          </Pressable>
        ) : null}

        {!canAdvance && remainingIds.length > 0 ? (
          <Text style={styles.countText}>
            {swipedCount} of {TINDER_EVENT_IDS.length} swiped
          </Text>
        ) : null}

        <Pressable onPress={onNext} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip this step</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default StepTinderCards;
