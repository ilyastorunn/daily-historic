import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme } from '@/theme';
import { useTimeMachine } from '@/hooks/use-time-machine';
import { TimelineCard } from '@/components/time-machine/TimelineCard';
import { trackEvent } from '@/services/analytics';
import { heroEvent } from '@/constants/events';
import { getImageUri } from '@/utils/image-source';

const TimeMachineScreen = () => {
  const params = useLocalSearchParams<{ year?: string; mode?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const yearParam = params.year ? Number(params.year) : undefined;
  const teaserMode = params.mode === 'teaser';

  const { timeline, loading, error, loadTimeline } = useTimeMachine({
    enabled: !teaserMode,
    seedOnMount: !teaserMode && !yearParam,
    premium: !teaserMode,
  });

  const events = useMemo(() => timeline?.events ?? [], [timeline?.events]);
  const beforeEvents = timeline?.before ?? [];
  const afterEvents = timeline?.after ?? [];
  const year = timeline?.year ?? yearParam;
  const [isYearPickerVisible, setYearPickerVisible] = useState(false);

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
  const availableYears = useMemo(() => {
    const defaultYears = [1969, 1986, 1492, 1776];
    const timelineYears = events
      .map((event) => (event.dateISO ? Number(event.dateISO.slice(0, 4)) : undefined))
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
    const merged = Array.from(new Set([year ?? defaultYears[0], ...timelineYears, ...defaultYears]));
    return merged.sort((a, b) => a - b);
  }, [events, year]);

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
            <View style={styles.contextSection}>
              <Text style={styles.contextTitle}>What led here</Text>
              {beforeEvents.length > 0 ? (
                beforeEvents.map((event) => (
                  <TimelineCard key={event.id} {...event} footerLabel="Before" />
                ))
              ) : (
                <Text style={styles.helper}>More context coming soon.</Text>
              )}
            </View>
          ) : null}

          {!teaserMode ? (
            <View style={styles.contextSection}>
              <Text style={styles.contextTitle}>What followed</Text>
              {afterEvents.length > 0 ? (
                afterEvents.map((event) => (
                  <TimelineCard key={event.id} {...event} footerLabel="After" />
                ))
              ) : (
                <Text style={styles.helper}>Stay tuned for follow-up stories.</Text>
              )}
            </View>
          ) : null}

          {!teaserMode ? (
            <View style={styles.controls}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setYearPickerVisible(true)}
                style={styles.yearPickerButton}
              >
                <Text style={styles.yearPickerLabel}>Choose another year</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.controls}>
              <Text style={styles.helper}>Upgrade soon to unlock full journeys.</Text>
            </View>
          )}

          <Text style={styles.note} onPress={() => router.back()}>
            ← Back to Home
          </Text>
        </ScrollView>
      </View>
      {!teaserMode ? (
        <Modal
          transparent
          visible={isYearPickerVisible}
          animationType="fade"
          onRequestClose={() => setYearPickerVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select a year</Text>
              {availableYears.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => {
                    setYearPickerVisible(false);
                    trackEvent('time_machine_year_selected', { year: option });
                    loadTimeline(option);
                  }}
                  style={styles.modalOption}
                >
                  <Text style={styles.modalOptionLabel}>{option}</Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() => setYearPickerVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelLabel}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
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
    contextSection: {
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    contextTitle: {
      fontFamily: 'Times New Roman',
      fontSize: 22,
      color: theme.colors.textPrimary,
    },
    controls: {
      paddingVertical: theme.spacing.md,
    },
    yearPickerButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.surface,
    },
    yearPickerLabel: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    note: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    modalContainer: {
      width: '100%',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    modalTitle: {
      fontFamily: 'Times New Roman',
      fontSize: 22,
      color: theme.colors.textPrimary,
    },
    modalOption: {
      paddingVertical: theme.spacing.sm,
    },
    modalOptionLabel: {
      fontFamily: 'System',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    modalCancel: {
      marginTop: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    modalCancelLabel: {
      fontFamily: 'System',
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

export default TimeMachineScreen;
