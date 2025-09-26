import { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import type { StepComponentProps } from '../types';
import { styles } from '../styles';

type PreviewCard = {
  id: string;
  title: string;
  date: string;
  summary: string;
  category: string;
};

const previewCards: PreviewCard[] = [
  {
    id: 'moon-landing',
    date: '20 July 1969',
    title: 'Apollo 11 Touches Down',
    summary: 'Neil Armstrong sets foot on the Moon, ushering in a new era of exploration.',
    category: 'Science & Discovery',
  },
  {
    id: 'printing-press',
    date: '23 February 1455',
    title: 'Gutenberg Prints the First Bible',
    summary: 'Mass printing sparks knowledge revolutions across Europe and beyond.',
    category: 'Inventions',
  },
  {
    id: 'civil-rights',
    date: '28 August 1963',
    title: '“I Have a Dream” Speech',
    summary: 'Dr. Martin Luther King Jr. inspires millions during the March on Washington.',
    category: 'Civil Rights',
  },
];

const StepPreview = ({ onNext }: StepComponentProps) => {
  const scrollRef = useRef<ScrollView>(null);
  const { updateState } = useOnboardingContext();
  const [cardWidth, setCardWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    updateState({ heroPreviewSeen: true });
  }, [updateState]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!cardWidth) {
      return;
    }

    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / cardWidth);
    setActiveIndex(Math.min(Math.max(index, 0), previewCards.length - 1));
  };

  const handleLayout = (width: number) => {
    if (cardWidth !== width) {
      setCardWidth(width);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <View style={styles.carouselWrapper}>
      <Text style={styles.stepTitle}>Here’s what a Chrono moment looks like</Text>
      <Text style={styles.sectionCopy}>
        Swipe through a few highlights while we line up the perfect selections for you.
      </Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={styles.carouselScroll}
      >
        {previewCards.map((card) => (
          <View
            key={card.id}
            style={[styles.carouselCard, cardWidth ? { width: cardWidth } : null]}
            onLayout={(event) => handleLayout(event.nativeEvent.layout.width)}
          >
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.cardImageLabel}>{card.category}</Text>
            </View>
            <Text style={styles.cardMeta}>{card.date}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.sectionCopy}>{card.summary}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.paginationDots}>
        {previewCards.map((card, index) => (
          <View
            key={card.id}
            style={[
              styles.paginationDot,
              index === activeIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      <Pressable onPress={handleSkip} style={styles.inlineGhostButton}>
        <Text style={styles.inlineGhostButtonText}>Skip preview</Text>
      </Pressable>
    </View>
  );
};

export default StepPreview;
