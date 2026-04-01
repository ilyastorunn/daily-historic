import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, useRouter } from 'expo-router';

import { YearSelector } from '@/components/time-machine/YearSelector';
import { trackEvent } from '@/services/analytics';
import { getLastVisitedTimeMachineYear } from '@/services/time-machine';
import { useAppTheme } from '@/theme';
import { clampTimeMachineYear } from '@/utils/time-machine';

const TimeMachineExplorerScreen = () => {
  const router = useRouter();
  const theme = useAppTheme();
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
      <View style={styles.container}>
        <YearSelector
          initialYear={selectedYear}
          onYearChange={setSelectedYear}
          onYearCommit={handleYearCommit}
        />
      </View>
    </SafeAreaView>
  );
};

const buildStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.screen,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.screen,
    },
  });

export default TimeMachineExplorerScreen;
