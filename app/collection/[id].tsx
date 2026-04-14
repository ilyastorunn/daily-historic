import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme } from '@/theme';
import { useCollectionDetail } from '@/hooks/use-collection-detail';
import { CollectionHeroSection } from '@/components/collection/CollectionHeroSection';
import { CollectionImmersiveStackCard } from '@/components/collection/CollectionImmersiveStackCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { trackEvent } from '@/services/analytics';

const HERO_STACK_BASE_HEIGHT = 278;

const CollectionDetailScreen = () => {
  const { id, source, monthKey } = useLocalSearchParams<{ id?: string; source?: string; monthKey?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const { collection, loading, error } = useCollectionDetail({ collectionId: id ?? null, enabled: Boolean(id) });
  const items = useMemo(() => collection?.items ?? [], [collection?.items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState<number | null>(null);
  const [carouselRegionHeight, setCarouselRegionHeight] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      trackEvent('monthly_collection_opened', {
        collection_id: id,
        source: source ?? 'collection_screen',
        month_key: monthKey,
      });
    }
  }, [id, monthKey, source]);

  useEffect(() => {
    if (id && source?.includes('iae')) {
      trackEvent('iae_deeplink_opened', { collection_id: id, source });
    }
  }, [id, source]);

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  const handleCarouselLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && Math.abs(width - (carouselWidth ?? 0)) > 1) {
      setCarouselWidth(width);
    }
    if (height > 0 && Math.abs(height - (carouselRegionHeight ?? 0)) > 1) {
      setCarouselRegionHeight(height);
    }
  }, [carouselRegionHeight, carouselWidth]);

  const fallbackWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return Math.max(screenWidth - 40, 320);
  }, []);

  const computedItemWidth = carouselWidth ?? fallbackWidth;
  const effectiveItemWidth = Math.max(270, computedItemWidth - 26);
  const computedCardHeight = useMemo(() => {
    if (!carouselRegionHeight) {
      return 374;
    }
    return Math.max(346, carouselRegionHeight - 8);
  }, [carouselRegionHeight]);

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {collection ? (
          <View style={styles.stage}>
            <CollectionHeroSection
              title={collection.title}
              subtitle={collection.subtitle}
              blurb={collection.heroBlurb ?? collection.blurb}
              coverImageUrl={collection.coverUrl}
              baseHeight={HERO_STACK_BASE_HEIGHT}
            />

            <View style={[styles.lowerPanel, { paddingBottom: insets.bottom + 2 }]}>
              <View style={styles.carouselBlock} onLayout={handleCarouselLayout}>
                <PeekCarousel
                  data={items}
                  keyExtractor={(item) => item.id}
                  onIndexChange={setActiveIndex}
                  itemWidth={effectiveItemWidth}
                  gap={0}
                  contentPaddingVertical={0}
                  renderItem={({ item }) => (
                    <CollectionImmersiveStackCard
                      id={item.id}
                      title={item.title}
                      summary={item.summary}
                      year={item.year ? String(item.year) : undefined}
                      imageUrl={item.imageUrl}
                      categoryId={item.categoryIds?.[0]}
                      isActive={true}
                      cardHeight={computedCardHeight}
                      onPress={(eventId) => router.push({ pathname: '/event/[id]', params: { id: eventId } })}
                    />
                  )}
                  testID="collection-detail-carousel"
                />
              </View>

              {items.length > 1 ? (
                <View style={styles.dotsRow}>
                  {items.map((item, index) => (
                    <View key={item.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.stateContainer}>
            {loading ? <Text style={styles.helper}>Loading stories…</Text> : null}
            {!loading && error ? <Text style={styles.error}>Unable to load this collection.</Text> : null}
          </View>
        )}

        <View style={[styles.navBar, { top: insets.top + theme.spacing.lg }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.85 }]}
          >
            <IconSymbol name="chevron.right" size={18} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.navLabel}>Back</Text>
          </Pressable>
        </View>

        <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
      </View>
    </View>
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) => {
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.screen,
    },
    container: {
      flex: 1,
    },
    stage: {
      flex: 1,
    },
    lowerPanel: {
      flex: 1,
      backgroundColor: theme.colors.screen,
      marginTop: 0,
    },
    carouselBlock: {
      flex: 1,
      marginTop: 10,
      paddingHorizontal: 10,
      justifyContent: 'flex-start',
      overflow: 'hidden',
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
      marginBottom: 2,
      paddingHorizontal: 20,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: 'rgba(67, 62, 53, 0.28)',
    },
    dotActive: {
      width: 18,
      backgroundColor: theme.colors.textSecondary,
    },
    stateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    navBar: {
      position: 'absolute',
      top: theme.spacing.lg,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 1200,
      elevation: 1200,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      backgroundColor: 'rgba(12, 10, 6, 0.45)',
    },
    navLabel: {
      fontFamily: sansFamily,
      fontSize: theme.typography.helper.fontSize,
      color: '#fff',
    },
    helper: {
      fontFamily: 'System',
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    error: {
      fontFamily: 'System',
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.borderStrong,
      textAlign: 'center',
    },
    bottomSafeArea: {
      backgroundColor: theme.colors.screen,
    },
  });
};

export default CollectionDetailScreen;
