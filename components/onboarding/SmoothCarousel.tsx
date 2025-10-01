import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';

import { spacingScale, styles } from './styles';

type PreviewCard = {
  id: string;
  heading: string;
  subheading: string;
  image: number;
};

interface SmoothCarouselProps {
  cards: PreviewCard[];
  onActiveIndexChange?: (index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const SIDE_INSET = spacingScale.xl * 2; // matches horizontal padding (24 * 2)
const CARD_WIDTH = screenWidth - SIDE_INSET;

const SmoothCarousel: React.FC<SmoothCarouselProps> = ({ cards, onActiveIndexChange }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardHeight = useMemo(() => Math.round(CARD_WIDTH * 1.1), []);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const index = event.nativeEvent.position;
      setActiveIndex(index);
      if (onActiveIndexChange) {
        onActiveIndexChange(index);
      }
    },
    [onActiveIndexChange]
  );

  const renderCard = useCallback((card: PreviewCard) => {
    return (
      <View
        key={card.id}
        style={styles.carouselPage}
      >
        <View style={[styles.carouselCard, { height: cardHeight }]}
        >
          <Image
            source={card.image}
            style={styles.previewCardImage}
            contentFit="cover"
            transition={200}
          />

          {/* Blur backdrop for text readability */}
          <View style={styles.previewCardBlurBackdrop} />

          <View style={styles.previewCardOverlay}>
            <View style={styles.previewCardTextGroup}>
              <Text style={styles.previewCardHeading}>{card.heading}</Text>
              <Text style={styles.previewCardSubheading}>{card.subheading}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }, [cardHeight]);

  const renderPaginationDots = () => {
    return cards.map((_, index) => {
      const isActive = index === activeIndex;
      return (
        <View
          key={index}
          style={[
            styles.paginationDot,
            isActive && styles.paginationDotActive,
          ]}
        />
      );
    });
  };

  return (
    <View style={styles.carouselWrapper}>
      <View style={styles.carouselPagerContainer}>
        <PagerView
          initialPage={0}
          style={[styles.carouselPager, { height: cardHeight }]}
          onPageSelected={handlePageSelected}
        >
          {cards.map((card) => renderCard(card))}
        </PagerView>
      </View>

      <View style={styles.paginationDots}>{renderPaginationDots()}</View>
    </View>
  );
};

export default SmoothCarousel;
