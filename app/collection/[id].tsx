import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme } from '@/theme';
import { useCollectionDetail } from '@/hooks/use-collection-detail';
import { TimelineCard } from '@/components/time-machine/TimelineCard';
import { CollectionHeroSection } from '@/components/collection/CollectionHeroSection';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { trackEvent } from '@/services/analytics';

const CollectionDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const { collection, loading, error } = useCollectionDetail({ collectionId: id ?? null, enabled: Boolean(id) });

  useEffect(() => {
    if (id) {
      trackEvent('collections_detail_opened', { collection_id: id });
    }
  }, [id]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          {collection ? (
            <CollectionHeroSection
              title={collection.title}
              blurb={collection.blurb}
              coverImageUrl={collection.coverUrl}
            />
          ) : null}

          {/* Loading & Error States */}
          {loading ? <Text style={styles.helper}>Loading stories…</Text> : null}
          {error ? <Text style={styles.error}>Unable to load this collection.</Text> : null}

          {/* Event Cards List */}
          {collection?.items && collection.items.length > 0 ? (
            <View style={styles.cardList}>
              {collection.items.map((item) => (
                <TimelineCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  summary={item.summary}
                  imageUrl={item.imageUrl}
                  dateISO={item.year ? String(item.year) : undefined}
                  categoryId={item.categoryIds?.[0]}
                  onPress={(eventId) => router.push({ pathname: '/event/[id]', params: { id: eventId } })}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>

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
      </View>
    </SafeAreaView>
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
    scrollContent: {
      paddingBottom: 40,
      gap: 20, // 20pt spacing between sections
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
    cardList: {
      paddingHorizontal: 20, // Minimum 20pt margin per NorthStar
      gap: 16, // Minimum 16pt between cards per NorthStar
    },
  });
};

export default CollectionDetailScreen;
