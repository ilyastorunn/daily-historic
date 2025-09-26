import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';

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
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    updateState({ heroPreviewSeen: true });
  }, [updateState]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!containerWidth) {
        return;
      }

      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / containerWidth);
      setActiveIndex(Math.min(Math.max(index, 0), previewCards.length - 1));
    },
    [containerWidth]
  );

  const handleContainerLayout = useCallback((width: number) => {
    if (containerWidth !== width) {
      setContainerWidth(width);
    }
  }, [containerWidth]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!containerWidth) {
        return;
      }

      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / containerWidth);
      if (index !== activeIndex) {
        setActiveIndex(Math.min(Math.max(index, 0), previewCards.length - 1));
      }
    },
    [activeIndex, containerWidth]
  );

  const cardHeight = useMemo(() => {
    if (!containerWidth) {
      return;
    }

    return Math.round(containerWidth * 1.1);
  }, [containerWidth]);

  const handleSkip = () => {
    onNext();
  };

  const renderCard = useCallback(
    ({ item, index }: { item: PreviewCard; index: number }) => {
      const cardStyle = [
        styles.carouselCard,
        containerWidth ? { width: containerWidth, height: cardHeight } : null,
        index !== previewCards.length - 1 ? styles.carouselCardSpacing : null,
      ];

      return (
        <View style={cardStyle}>
          <Image
            source={item.image}
            style={styles.previewCardImage}
            contentFit="cover"
            transition={200}
          />
          
          {/* Blur backdrop for text readability */}
          <View style={styles.previewCardBlurBackdrop} />

          <View style={styles.previewCardOverlay}>
            <View style={styles.previewCardTextGroup}>
              <Text style={styles.previewCardHeading}>{item.heading}</Text>
              <Text style={styles.previewCardSubheading}>{item.subheading}</Text>
            </View>
          </View>
        </View>
      );
    },
    [cardHeight, containerWidth]
  );

  return (
    <View style={styles.carouselWrapper}>
      <Text style={styles.stepTitle}>Here’s what a Chrono moment looks like</Text>
      <Text style={styles.sectionCopy}>
        Swipe through a few highlights while we line up the perfect selections for you.
      </Text>

      <FlatList
        data={previewCards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="center"
        snapToInterval={containerWidth || undefined}
        disableIntervalMomentum
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        contentContainerStyle={styles.carouselScroll}
        onLayout={(event) => handleContainerLayout(event.nativeEvent.layout.width)}
      />

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
