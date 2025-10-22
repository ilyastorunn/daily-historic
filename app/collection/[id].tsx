import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme } from '@/theme';
import { useCollectionDetail } from '@/hooks/use-collection-detail';
import { TimelineCard } from '@/components/time-machine/TimelineCard';
import { trackEvent } from '@/services/analytics';

const CollectionDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const { collection, loading, error } = useCollectionDetail({ collectionId: id ?? null, enabled: Boolean(id) });

  useEffect(() => {
    if (id) {
      trackEvent('collections_detail_opened', { collection_id: id });
    }
  }, [id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{collection?.title ?? 'Collection'}</Text>
          {collection?.blurb ? <Text style={styles.blurb}>{collection.blurb}</Text> : null}
          {loading ? <Text style={styles.helper}>Loading stories…</Text> : null}
          {error ? <Text style={styles.error}>Unable to load this collection.</Text> : null}

          <View style={styles.list}>
            {collection?.items.map((item) => (
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

          <Text style={styles.backLink} onPress={() => router.back()}>
            ← Back to Home
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.appBackground,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.screen,
    },
    content: {
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    title: {
      fontFamily: 'Times New Roman',
      fontSize: 32,
      color: theme.colors.textPrimary,
    },
    blurb: {
      fontFamily: 'System',
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    helper: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    error: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.borderStrong,
    },
    list: {
      gap: theme.spacing.md,
    },
    backLink: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

export default CollectionDetailScreen;
