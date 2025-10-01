import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import SmoothCarousel from '../SmoothCarousel';
import { styles } from '../styles';
import type { StepComponentProps } from '../types';

type PreviewCard = {
  id: string;
  heading: string;
  subheading: string;
  image: number;
};

const previewCards: PreviewCard[] = [
  {
    id: 'moon-landing-1969',
    heading: 'On This Day: July 20, 1969',
    subheading: 'Neil Armstrong walked on the Moon.',
    image: require('@/pics/960px-Neil_Armstrong_pose.jpg'),
  },
  {
    id: 'empire-destruction-1836',
    heading: 'On This Day: 1836',
    subheading: 'The Course of Empire painted by Thomas Cole.',
    image: require('@/pics/Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg'),
  },
  {
    id: 'caesar-death-44bc',
    heading: 'On This Day: March 15, 44 BC',
    subheading: 'Julius Caesar was assassinated in Rome.',
    image: require('@/pics/Vincenzo_Camuccini_-_La_morte_di_Cesare.jpg'),
  },
];

const StepPreview = ({ onNext }: StepComponentProps) => {
  const { updateState } = useOnboardingContext();
  useEffect(() => {
    updateState({ heroPreviewSeen: true });
  }, [updateState]);

  return (
    <View style={[styles.stackGap, styles.carouselWrapper]}>
      <Text style={styles.stepTitle}>Here’s what a Chrono moment looks like</Text>
      <Text style={styles.sectionCopy}>
        Swipe through a few highlights while we line up the perfect selections for you.
      </Text>

      <SmoothCarousel cards={previewCards} />
    </View>
  );
};

export default StepPreview;
