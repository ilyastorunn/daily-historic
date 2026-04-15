import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import type { ImageSource } from 'expo-image';

import { EditorialCard } from '@/components/ui/editorial-card';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { EVENT_LIBRARY, HERO_EVENT_ID } from '@/constants/events';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

type PreviewCard = {
  id: string;
  badge: string;
  title: string;
  summary: string;
  meta?: string;
  image: ImageSource;
};

const PREVIEW_EVENT_IDS = [
  HERO_EVENT_ID,
  'women-suffrage-usa',
  'ada-lovelace-analytical',
  'harlem-renaissance-jazz',
  'rosetta-stone-decode',
  'd-day-normandy-landing',
  'marie-curie-nobel',
  'rosa-parks-bus-boycott',
  'magellan-circumnavigation',
  'dna-structure-discovery',
] as const;

const mapEventToPreviewCard = (eventId: string): PreviewCard => {
  const event = EVENT_LIBRARY.find((entry) => entry.id === eventId);

  if (!event) {
    throw new Error(`StepPreview is missing a configured event: ${eventId}`);
  }

  return {
    id: event.id,
    badge: event.year,
    title: event.title,
    summary: event.summary,
    meta: event.location,
    image: event.image,
  };
};

const previewCardPool = PREVIEW_EVENT_IDS.map(mapEventToPreviewCard);

const pickRandomCards = <T,>(items: readonly T[], count: number): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex]!, shuffled[index]!];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing } = theme;
  const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    container: {
      gap: spacing.md,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.6,
      color: colors.textPrimary,
    },
    body: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      maxWidth: 320,
    },
  });
};

const StepPreview = (_props: StepComponentProps) => {
  const { updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const [previewCards] = useState(() => pickRandomCards(previewCardPool, 3));
  const themedStyles = useMemo(() => createStyles(theme), [theme]);
  const { styles: onboardingStyles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const carouselWidth = useMemo(() => {
    const { width } = Dimensions.get('window');
    return Math.max(width - theme.spacing.xl * 2, 0);
  }, [theme.spacing.xl]);

  useEffect(() => {
    updateState({ heroPreviewSeen: true });
  }, [updateState]);

  return (
    <ScrollView
      style={themedStyles.scroll}
      contentContainerStyle={[onboardingStyles.stackGap, themedStyles.container]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={themedStyles.title}>A glimpse of today&apos;s moment</Text>
      <Text style={themedStyles.body}>
        Swipe through editorial cards and feel how Chrono curates a single, focused story each day.
      </Text>

      <PeekCarousel
        data={previewCards}
        renderItem={({ item }) => (
          <EditorialCard
            badge={item.badge}
            title={item.title}
            summary={item.summary}
            meta={item.meta}
            imageSource={item.image}
          />
        )}
        keyExtractor={(item) => item.id}
        itemWidth={carouselWidth}
        gap={0}
        testID="onboarding-preview-carousel"
      />
    </ScrollView>
  );
};

export default StepPreview;
