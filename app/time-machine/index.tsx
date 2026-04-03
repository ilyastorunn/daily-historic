import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { getTimeMachineExplorerPalette } from '@/components/time-machine/explorer-palette';
import { YearSelector } from '@/components/time-machine/YearSelector';
import { trackEvent } from '@/services/analytics';
import { getLastVisitedTimeMachineYear } from '@/services/time-machine';
import { useAppTheme } from '@/theme';
import { clampTimeMachineYear } from '@/utils/time-machine';

const TimeMachineExplorerScreen = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const palette = useMemo(() => getTimeMachineExplorerPalette(theme), [theme]);
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const [selectedYear, setSelectedYear] = useState(() => clampTimeMachineYear(new Date().getFullYear()));
  const navigatingRef = useRef(false);

  useEffect(() => {
    trackEvent('time_machine_explorer_opened');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLastYear = async () => {
      try {
        const year = await getLastVisitedTimeMachineYear();
        if (!cancelled) {
          setSelectedYear(year);
        }
      } catch {
        // Keep current year fallback.
      }
    };

    void loadLastYear();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleYearCommit = useCallback(
    (year: number) => {
      if (navigatingRef.current) {
        return;
      }

      navigatingRef.current = true;
      trackEvent('time_machine_year_selected', { year });
      trackEvent('time_machine_started', { year, source: 'explorer' });

      router.push(`/time-machine/${year}` as Href);

      setTimeout(() => {
        navigatingRef.current = false;
      }, 600);
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} animated />
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { backgroundColor: palette.backPressed },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={palette.selectedText} />
          </Pressable>
        </View>
        <View style={styles.stage}>
          <YearSelector
            initialYear={selectedYear}
            onYearChange={setSelectedYear}
            onYearCommit={handleYearCommit}
          />
          <Pressable
            accessibilityLabel={`Enter ${selectedYear}`}
            accessibilityRole="button"
            onPress={() => handleYearCommit(selectedYear)}
            style={({ pressed }) => [
              styles.enterButton,
              { borderBottomColor: theme.mode === 'dark' ? 'rgba(237, 231, 222, 0.18)' : 'rgba(28, 26, 22, 0.14)' },
              pressed && { opacity: 0.58, borderBottomColor: palette.selectedText },
            ]}
          >
            <Text style={[styles.enterButtonText, { color: palette.selectedText }]}>
              Enter {selectedYear}
            </Text>
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
      backgroundColor: theme.mode === 'dark' ? theme.palette.slate950 : theme.palette.slate50,
    },
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    topBar: {
      position: 'absolute',
      top: theme.spacing.sm,
      left: theme.spacing.sm,
      zIndex: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.xl,
    },
    enterButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
      borderBottomWidth: 1,
    },
    enterButtonText: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500',
      letterSpacing: 2.2,
      textTransform: 'uppercase',
    },
  });
};

export default TimeMachineExplorerScreen;
