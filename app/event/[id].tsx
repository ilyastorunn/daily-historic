import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image, type ImageErrorEventData, type ImageLoadEventData } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getEventById, heroEvent } from '@/constants/events';
import { formatCategoryLabel, formatEraLabel } from '@/constants/personalization';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { useEventContent } from '@/hooks/use-event-content';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import { createLinearGradientSource } from '@/utils/gradient';
import { getImageUri } from '@/utils/image-source';
import {
  buildEventSourceLinks,
  getEventImageUri,
  getEventLocation,
  getEventSummary,
  getEventTitle,
  getEventYearLabel,
  selectPrimaryPage,
} from '@/utils/event-presentation';
import { createImageSource, toImageSource } from '@/utils/wikimedia-image-source';

// Reactions removed - using Like + Deep Dive + Save + Share instead

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.appBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.screen,
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    heroHeader: {
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.heroBackground,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.2,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 18 },
      elevation: 10,
    },
    heroMedia: {
      height: 340,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    heroBody: {
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accentPrimary,
      color: colors.accentPrimary,
      fontFamily: sansFamily,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontFamily: serifFamily,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.4,
      color: colors.textPrimary,
    },
    heroSummary: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    heroMeta: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textTertiary,
    },
    contentSection: {
      paddingHorizontal: spacing.xl,
      gap: spacing.lg,
    },
    paragraph: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: 24,
      color: colors.textPrimary,
    },
    secondaryCopy: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    callout: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      gap: spacing.xs,
    },
    calloutLabel: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      color: colors.textPrimary,
    },
    calloutBody: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    engagementRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    engagementButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    engagementButtonActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    sourceList: {
      gap: spacing.xs,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sourceLink: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textPrimary,
      textDecorationLine: 'underline',
    },
    navBar: {
      position: 'absolute',
      top: spacing.lg,
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 100,
      elevation: 100,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(12, 10, 6, 0.45)',
    },
    navLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: '#fff',
    },
    missingSurface: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xl,
      backgroundColor: colors.screen,
    },
  });
};

const EventDetailScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    source?: string;
    carouselIndex?: string;
    carouselItemIds?: string;
  }>();
  const rawId = params.id;
  const eventIdParam = Array.isArray(rawId) ? rawId[0] : rawId ?? null;
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const carouselIndex = params.carouselIndex ? parseInt(Array.isArray(params.carouselIndex) ? params.carouselIndex[0] : params.carouselIndex) : undefined;
  const carouselItemIds = params.carouselItemIds
    ? (Array.isArray(params.carouselItemIds) ? params.carouselItemIds[0] : params.carouselItemIds).split(',')
    : undefined;

  const isFromCarousel = source === 'home-carousel';
  const hasNext = isFromCarousel && carouselIndex !== undefined && carouselItemIds !== undefined && carouselIndex < carouselItemIds.length - 1;
  const nextEventId = hasNext && carouselIndex !== undefined && carouselItemIds ? carouselItemIds[carouselIndex + 1] : undefined;
  const staticEvent = useMemo(() => (eventIdParam ? getEventById(eventIdParam) : null), [eventIdParam]);
  const { event: fetchedEvent, loading: remoteLoading, error: remoteError } = useEventContent(eventIdParam);
  const [imageLoadError, setImageLoadError] = React.useState(false);
  const fallbackImageSource = toImageSource(staticEvent?.image) ?? toImageSource(heroEvent.image);
  const dynamicImageUri = fetchedEvent ? getEventImageUri(fetchedEvent) : undefined;
  const heroImageSource = imageLoadError || !dynamicImageUri ? fallbackImageSource : createImageSource(dynamicImageUri);
  const heroImageUri = useMemo(
    () => (dynamicImageUri && !imageLoadError ? dynamicImageUri : getImageUri(fallbackImageSource)),
    [dynamicImageUri, fallbackImageSource, imageLoadError]
  );
  const displayEventId = fetchedEvent?.eventId ?? staticEvent?.id ?? eventIdParam ?? heroEvent.id;
  const { isSaved, isLiked, toggleSave, toggleLike } = useEventEngagement(displayEventId);
  const title = fetchedEvent ? getEventTitle(fetchedEvent) : staticEvent?.title ?? heroEvent.title;
  const summary = fetchedEvent ? getEventSummary(fetchedEvent) : staticEvent?.summary ?? heroEvent.summary;
  const yearBadge = fetchedEvent ? getEventYearLabel(fetchedEvent) : staticEvent?.year ?? '';
  const locationText = fetchedEvent ? getEventLocation(fetchedEvent) : staticEvent?.location ?? '';
  const eraLabel = fetchedEvent?.era ? formatEraLabel(fetchedEvent.era) : undefined;
  const categoryLabels = fetchedEvent
    ? (fetchedEvent.categories ?? []).map((category) => formatCategoryLabel(category))
    : (staticEvent?.categories ?? []).map((category) =>
        category
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      );
  const heroMetaParts: string[] = [];
  if (locationText) {
    heroMetaParts.push(locationText);
  }
  if (eraLabel) {
    heroMetaParts.push(eraLabel);
  }
  if (categoryLabels.length > 0) {
    heroMetaParts.push(categoryLabels.join(', '));
  }
  const heroMeta = heroMetaParts.join(' • ');
  const detailParagraphs = fetchedEvent
    ? (() => {
        const paragraphs: string[] = [];
        const primaryPage = selectPrimaryPage(fetchedEvent);
        if (primaryPage?.extract) {
          paragraphs.push(primaryPage.extract);
        } else if (fetchedEvent.text) {
          paragraphs.push(fetchedEvent.text);
        }
        return paragraphs;
      })()
    : staticEvent?.detail
      ? [staticEvent.detail]
      : [];
  const whyItMatters = staticEvent?.whyItMatters;
  const sources = fetchedEvent ? buildEventSourceLinks(fetchedEvent) : staticEvent?.sources ?? [];
  const shareTitle = title;
  const shareSummary = summary;
  const hasEvent = Boolean(fetchedEvent || staticEvent);

  useEffect(() => {
    if (remoteError) {
      console.error('Failed to load event content', remoteError);
    }
  }, [remoteError]);

  // Reset image error state when event changes
  useEffect(() => {
    setImageLoadError(false);
  }, [eventIdParam]);

  const heroOverlay = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(12, 10, 6, 0.1)' },
          { offset: 100, color: 'rgba(12, 10, 6, 0.6)' },
        ],
        { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
      ),
    []
  );

  const handleHeroImageLoad = useCallback(
    (loadEvent: ImageLoadEventData) => {
      console.log('[EventDetail] hero image loaded', {
        eventId: displayEventId,
        uri: heroImageUri,
        resolvedUrl: loadEvent.source?.url,
        cacheType: loadEvent.cacheType,
        width: loadEvent.source?.width,
        height: loadEvent.source?.height,
      });
    },
    [displayEventId, heroImageUri]
  );

  const handleHeroImageError = useCallback(
    (errorEvent: ImageErrorEventData) => {
      console.warn('[EventDetail] hero image failed to load, using fallback', {
        eventId: displayEventId,
        uri: heroImageUri,
        error: errorEvent.error,
      });
      setImageLoadError(true);
    },
    [displayEventId, heroImageUri]
  );

  const handleNext = useCallback(() => {
    if (!nextEventId || carouselIndex === undefined || !carouselItemIds) return;

    router.push({
      pathname: '/event/[id]',
      params: {
        id: nextEventId,
        source: 'home-carousel',
        carouselIndex: String(carouselIndex + 1),
        carouselItemIds: carouselItemIds.join(','),
      },
    });
  }, [nextEventId, carouselIndex, carouselItemIds, router]);

  if (!hasEvent && remoteLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.missingSurface}>
          <Text style={styles.heroTitle}>Loading story…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasEvent && !remoteLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.missingSurface}>
          <Text style={styles.heroTitle}>We could not find that moment.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.actionLabel}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({ title: shareTitle, message: `${shareTitle} — ${shareSummary}` });
    } catch (error) {
      console.error('Share failed', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroHeader}>
            <View style={styles.heroMedia}>
              <Image
                source={heroImageSource}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
                onLoad={handleHeroImageLoad}
                onError={handleHeroImageError}
              />
              <Image
                pointerEvents="none"
                source={heroOverlay}
                style={styles.heroOverlay}
                contentFit="cover"
              />
            </View>
            <View style={styles.heroBody}>
              {yearBadge ? <Text style={styles.heroBadge}>{yearBadge}</Text> : null}
              <Text style={styles.heroTitle}>{title}</Text>
              <Text style={styles.heroSummary}>{summary}</Text>
              {heroMeta ? <Text style={styles.heroMeta}>{heroMeta}</Text> : null}

              <View style={styles.engagementRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Like"
                  accessibilityState={{ selected: isLiked }}
                  onPress={toggleLike}
                  style={({ pressed }) => [
                    styles.engagementButton,
                    isLiked && styles.engagementButtonActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <IconSymbol
                    name={isLiked ? 'heart.fill' : 'heart'}
                    size={22}
                    color={isLiked ? theme.colors.accentPrimary : theme.colors.textSecondary}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Deep Dive"
                  onPress={() => {
                    // TODO: Implement Deep Dive navigation
                    console.log('[Deep Dive] Placeholder for event:', displayEventId);
                  }}
                  style={({ pressed }) => [styles.engagementButton, pressed && { opacity: 0.85 }]}
                >
                  <IconSymbol name="book" size={22} color={theme.colors.textSecondary} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save"
                  accessibilityState={{ selected: isSaved }}
                  onPress={toggleSave}
                  style={({ pressed }) => [
                    styles.engagementButton,
                    isSaved && styles.engagementButtonActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <IconSymbol
                    name={isSaved ? 'bookmark.fill' : 'bookmark'}
                    size={22}
                    color={isSaved ? theme.colors.accentPrimary : theme.colors.textSecondary}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Share"
                  onPress={handleShare}
                  style={({ pressed }) => [styles.engagementButton, pressed && { opacity: 0.85 }]}
                >
                  <IconSymbol name="square.and.arrow.up" size={22} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.contentSection}>
            {(detailParagraphs.length > 0 ? detailParagraphs : [summary]).map((paragraph, index) => (
              <Text key={`detail-${index}`} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}

            {whyItMatters ? (
              <View style={styles.callout}>
                <Text style={styles.calloutLabel}>Why you’re seeing this</Text>
                <Text style={styles.calloutBody}>{whyItMatters}</Text>
              </View>
            ) : null}

            {sources.length > 0 ? (
              <>
                <Text style={styles.secondaryCopy}>Sources</Text>
                <View style={styles.sourceList}>
                  {sources.map((source) => (
                    <View key={source.url} style={styles.sourceRow}>
                      <IconSymbol name="chevron.right" size={16} color={theme.colors.textSecondary} />
                      <Pressable
                        accessibilityRole="link"
                        onPress={() => {
                          void Linking.openURL(source.url);
                        }}
                      >
                        <Text style={styles.sourceLink}>{source.label}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.navBar, { top: insets.top + theme.spacing.lg }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.85 }]}
          >
            <IconSymbol name="chevron.right" size={18} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.navLabel}>Back</Text>
          </Pressable>
          {hasNext ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next story"
              onPress={handleNext}
              style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.85 }]}
            >
              <IconSymbol name="chevron.right" size={18} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EventDetailScreen;
