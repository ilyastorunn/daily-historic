import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme } from '@/theme';
import { useCollectionDetail } from '@/hooks/use-collection-detail';
import {
  CollectionHeroSection,
  COLLECTION_HERO_BASE_HEIGHT,
} from '@/components/collection/CollectionHeroSection';
import {
  CollectionImmersiveStackCard,
  COLLECTION_STACK_CARD_HEIGHT,
} from '@/components/collection/CollectionImmersiveStackCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { trackEvent } from '@/services/analytics';

const STACK_CARD_GAP = 14;
const STACK_TOP_SPACER = 12;
const STACK_SNAP_INTERVAL = COLLECTION_STACK_CARD_HEIGHT + STACK_CARD_GAP;

const CollectionDetailScreen = () => {
  const { id, source, monthKey } = useLocalSearchParams<{ id?: string; source?: string; monthKey?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const heroHeight = COLLECTION_HERO_BASE_HEIGHT + insets.top;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const { collection, loading, error } = useCollectionDetail({ collectionId: id ?? null, enabled: Boolean(id) });
  const collectionItems = collection?.items ?? [];

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

  const stackStartOffset = heroHeight + STACK_TOP_SPACER;

  const snapOffsets = useMemo(() => {
    if (!collectionItems.length) {
      return undefined;
    }

    const offsets: number[] = [0];
    for (let index = 0; index < collectionItems.length; index += 1) {
      offsets.push(stackStartOffset + index * STACK_SNAP_INTERVAL);
    }
    return offsets;
  }, [collectionItems.length, stackStartOffset]);

  const updateActiveIndexFromOffset = useCallback(
    (offsetY: number) => {
      if (!collectionItems.length) {
        return;
      }

      const relativeOffset = offsetY - stackStartOffset;
      const nextIndex = Math.round(relativeOffset / STACK_SNAP_INTERVAL);
      const clamped = Math.max(0, Math.min(collectionItems.length - 1, nextIndex));
      if (activeIndexRef.current !== clamped) {
        activeIndexRef.current = clamped;
        setActiveIndex(clamped);
      }
    },
    [collectionItems.length, stackStartOffset]
  );

  const listHeader = useMemo(() => {
    if (!collection) {
      return null;
    }

    return (
      <View>
        <CollectionHeroSection
          title={collection.title}
          subtitle={collection.subtitle}
          blurb={collection.heroBlurb ?? collection.blurb}
          coverImageUrl={collection.coverUrl}
        />
        <View style={styles.stackTopSpacer} />
      </View>
    );
  }, [collection, styles.stackTopSpacer]);

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {collection ? (
          <FlatList
            data={collectionItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.stackItemWrap}>
                <CollectionImmersiveStackCard
                  id={item.id}
                  title={item.title}
                  summary={item.summary}
                  year={item.year ? String(item.year) : undefined}
                  imageUrl={item.imageUrl}
                  categoryId={item.categoryIds?.[0]}
                  isActive={index === activeIndex}
                  onPress={(eventId) => router.push({ pathname: '/event/[id]', params: { id: eventId } })}
                />
              </View>
            )}
            ListHeaderComponent={listHeader}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + theme.spacing.xxl }]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            snapToOffsets={snapOffsets}
            snapToAlignment="start"
            scrollEventThrottle={16}
            onScroll={(event) => updateActiveIndexFromOffset(event.nativeEvent.contentOffset.y)}
            onMomentumScrollEnd={(event) => updateActiveIndexFromOffset(event.nativeEvent.contentOffset.y)}
            getItemLayout={(_, index) => ({
              length: STACK_SNAP_INTERVAL,
              offset: stackStartOffset + index * STACK_SNAP_INTERVAL,
              index,
            })}
          />
        ) : (
          <View style={styles.stateContainer}>
            {loading ? <Text style={styles.helper}>Loading stories…</Text> : null}
            {!loading && error ? <Text style={styles.error}>Unable to load this collection.</Text> : null}
          </View>
        )}

        {/* Floating Navigation Bar */}
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

        {/* Bottom Safe Area */}
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
    stateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    listContent: {
      paddingBottom: theme.spacing.xxl,
    },
    stackTopSpacer: {
      height: STACK_TOP_SPACER,
    },
    navBar: {
      position: 'absolute',
      top: theme.spacing.lg,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 100,
      elevation: 100,
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
    stackItemWrap: {
      height: STACK_SNAP_INTERVAL,
      paddingHorizontal: 20,
      paddingBottom: STACK_CARD_GAP,
    },
    bottomSafeArea: {
      backgroundColor: theme.colors.screen,
    },
  });
};

export default CollectionDetailScreen;
