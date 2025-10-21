import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme } from '@/theme';
import { useTimeMachine } from '@/hooks/use-time-machine';
import { TimelineCard } from '@/components/time-machine/TimelineCard';
import { heroEvent } from '@/constants/events';
import { getImageUri } from '@/utils/image-source';

const TimeMachineScreen = () => {
  const params = useLocalSearchParams<{ year?: string; mode?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const yearParam = params.year ? Number(params.year) : undefined;
  const teaserMode = params.mode === 'teaser';

  const { timeline, loading, error } = useTimeMachine({
    enabled: !teaserMode,
    seedOnMount: !teaserMode && !yearParam,
    premium: !teaserMode,
  });

  const events = timeline?.events ?? [];
  const year = timeline?.year ?? yearParam;

  const teaserEvents = useMemo(
    () => [
      {
        id: heroEvent.id,
        title: heroEvent.title,
        summary: heroEvent.summary,
        imageUrl: getImageUri(heroEvent.image) ?? undefined,
        dateISO: heroEvent.date,
        categoryId: heroEvent.categories?.[0],
      },
    ],
    []
  );

  const displayEvents = teaserMode ? teaserEvents : events;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Time Machine</Text>
          {teaserMode ? (
            <Text style={styles.helper}>Preview unlocked moments before starting your premium journey.</Text>
          ) : (
            <Text style={styles.helper}>Exploring the year {year ?? '—'}.</Text>
          )}

          {loading ? <Text style={styles.loading}>Loading timeline…</Text> : null}
          {error ? <Text style={styles.error}>Unable to load events right now.</Text> : null}

          <View style={styles.timeline}>
            {displayEvents.map((event) => (
              <TimelineCard key={event.id} {...event} />
            ))}
          </View>

          {!teaserMode ? (
            <View style={styles.controls}>
              <Text style={styles.helper}>Choose another year (coming soon).</Text>
            </View>
          ) : null}

          <Text style={styles.note} onPress={() => router.back()}>
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
      gap: theme.spacing.lg,
    },
    title: {
      fontFamily: 'Times New Roman',
      fontSize: 32,
      color: theme.colors.textPrimary,
    },
    helper: {
      fontFamily: 'System',
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    loading: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    error: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.borderStrong,
    },
    timeline: {
      gap: theme.spacing.md,
    },
    controls: {
      paddingVertical: theme.spacing.md,
    },
    note: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

export default TimeMachineScreen;
