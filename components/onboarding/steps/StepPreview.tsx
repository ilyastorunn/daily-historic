import { useEffect, useMemo } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import type { ImageSource } from 'expo-image';

import { EditorialCard } from '@/components/ui/editorial-card';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import { buildWikimediaFileUrl } from '@/utils/wikimedia';

import { styles as onboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

type PreviewCard = {
  id: string;
  badge: string;
  title: string;
  summary: string;
  meta?: string;
  image: ImageSource;
};

const previewCards: PreviewCard[] = [
  {
    id: 'moon-landing-1969',
    badge: '1969',
    title: 'First footsteps on lunar soil',
    summary: 'Neil Armstrong steps onto the Moon and marks a new chapter for exploration.',
    meta: 'Sea of Tranquility, NASA Archive',
    image: { uri: buildWikimediaFileUrl('File:Neil_Armstrong_pose.jpg') },
  },
  {
    id: 'empire-destruction-1836',
    badge: '1836',
    title: 'Empire at the brink',
    summary: 'Thomas Cole paints the fall of an empire in sweeping colour and detail.',
    meta: 'New York, Cole Collection',
    image: {
      uri: buildWikimediaFileUrl('File:Thomas_Cole_-_The_Course_of_Empire_Destruction_1836.jpg'),
    },
  },
  {
    id: 'caesar-death-44bc',
    badge: '44 BC',
    title: 'A turning point for Rome',
    summary: 'Julius Caesar is assassinated in the Senate and republic tremors begin.',
    meta: 'Rome, Curia Pompeia',
    image: {
      uri: buildWikimediaFileUrl('File:Vincenzo_Camuccini_-_Morte_di_Cesare.jpg'),
    },
  },
];

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing } = theme;
  const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    container: {
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
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
  const themedStyles = useMemo(() => createStyles(theme), [theme]);
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
      <Text style={themedStyles.title}>A glimpse of today’s moment</Text>
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
