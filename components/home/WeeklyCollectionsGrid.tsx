import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';

import { createImageSource } from '@/utils/wikimedia-image-source';
import { useAppTheme, type ThemeDefinition } from '@/theme';

export type WeeklyCollectionTile = {
  id: string;
  title: string;
  coverUrl: string;
};

type WeeklyCollectionsGridProps = {
  title?: string;
  items: WeeklyCollectionTile[];
  loading?: boolean;
  onOpen: (id: string, index: number) => void;
  onSeeAll?: () => void;
  emptyMessage?: string;
  testID?: string;
  skeletonCount?: number;
};

const buildStyles = (theme: ThemeDefinition) => {
  const { spacing, radius, colors, typography } = theme;
  return StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleGroup: {
      flex: 1,
    },
    title: {
      fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' }),
      fontSize: 22,
      lineHeight: 26,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    seeAll: {
      fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    rows: {
      flexDirection: 'row',
      width: '100%',
    },
    rowSpacing: {
      marginTop: spacing.sm,
    },
    tileWrapper: {
      flex: 1,
      marginRight: spacing.sm,
    },
    tileWrapperLast: {
      marginRight: 0,
    },
    tile: {
      aspectRatio: 1.1,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surfaceSubtle,
      elevation: 2,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    tileSkeleton: {
      backgroundColor: colors.surfaceSubtle,
      opacity: 0.65,
      alignItems: 'stretch',
      justifyContent: 'center',
    },
    tileImage: {
      width: '100%',
      height: '100%',
    },
    tileOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(12, 10, 6, 0.40)',
      justifyContent: 'flex-end',
      padding: spacing.md,
    },
    tileTitle: {
      fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' }),
      color: colors.surface,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
    },
    emptyState: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
      fontSize: typography.helper.fontSize,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
    },
  });
};

const chunkItems = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export const WeeklyCollectionsGrid: React.FC<WeeklyCollectionsGridProps> = ({
  title = 'Weekly Collections',
  items,
  loading,
  onOpen,
  onSeeAll,
  emptyMessage = "Editor's picks incoming",
  testID,
  skeletonCount = 4,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const effectiveItems: (WeeklyCollectionTile & { isSkeleton?: boolean })[] = useMemo(() => {
    if (loading) {
      return Array.from({ length: skeletonCount }, (_, index) => ({
        id: `weekly-collection-skeleton-${index}`,
        title: '',
        coverUrl: '',
        isSkeleton: true,
      }));
    }
    return items;
  }, [items, loading, skeletonCount]);

  const handleImageError = (id: string, coverUrl: string) => {
    console.warn(`Collection image failed to load: ${id}`, coverUrl);
    setFailedImages((prev) => new Set(prev).add(id));
  };

  const handleOpen = (id: string, index: number) => (event: GestureResponderEvent) => {
    event.preventDefault();
    if (!loading) {
      onOpen(id, index);
    }
  };
  const rows = useMemo(() => chunkItems(effectiveItems, 2), [effectiveItems]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {onSeeAll ? (
          <Pressable accessibilityRole="button" onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <View>
          {rows.map((rowItems, rowIndex) => (
            <View
              key={`collection-row-${rowIndex}`}
              style={[styles.rows, rowIndex > 0 && styles.rowSpacing]}
            >
              {rowItems.map((item, itemIndex) => {
                const globalIndex = rowIndex * 2 + itemIndex;
                const isSkeleton = item.isSkeleton;
                return (
                  <View
                    key={item.id}
                    style={[styles.tileWrapper, itemIndex === rowItems.length - 1 && styles.tileWrapperLast]}
                  >
                    {isSkeleton ? (
                      <View style={[styles.tile, styles.tileSkeleton]} />
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleOpen(item.id, globalIndex)}
                        style={styles.tile}
                      >
                        {failedImages.has(item.id) ? (
                          <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>Image unavailable</Text>
                          </View>
                        ) : (
                          <Image
                            source={createImageSource(item.coverUrl)}
                            style={styles.tileImage}
                            contentFit="cover"
                            onError={() => handleImageError(item.id, item.coverUrl)}
                          />
                        )}
                        <View style={styles.tileOverlay}>
                          <Text style={styles.tileTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                );
              })}
              {rowItems.length === 1 ? <View style={[styles.tileWrapper, styles.tileWrapperLast]} /> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
