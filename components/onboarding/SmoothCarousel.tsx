import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { styles } from './styles';

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
const CARD_WIDTH = screenWidth - 48; // Accounting for horizontal padding
const CARD_SPACING = 16;
const SNAP_THRESHOLD = 0.2; // 20% of card width to trigger snap

const SmoothCarousel: React.FC<SmoothCarouselProps> = ({ 
  cards, 
  onActiveIndexChange 
}) => {
  const translateX = useSharedValue(0);
  const gestureOffset = useSharedValue(0);
  const activeIndexShared = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const maxTranslateX = -(cards.length - 1) * (CARD_WIDTH + CARD_SPACING);

  const cardHeight = useMemo(() => Math.round(CARD_WIDTH * 1.1), []);

  const updateActiveIndex = useCallback((index: number) => {
    setActiveIndex(index);
    if (onActiveIndexChange) {
      onActiveIndexChange(index);
    }
  }, [onActiveIndexChange]);

  const snapToIndex = useCallback((index: number) => {
    'worklet';
    const targetX = -index * (CARD_WIDTH + CARD_SPACING);
    translateX.value = withSpring(targetX, {
      damping: 20,
      stiffness: 150,
      mass: 1,
      velocity: 0,
    });
    activeIndexShared.value = index;
    runOnJS(updateActiveIndex)(index);
  }, [translateX, updateActiveIndex, activeIndexShared]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      gestureOffset.value = translateX.value;
    })
    .onUpdate((event) => {
      const nextTranslateX = gestureOffset.value + event.translationX;
      // Clamp to keep the first and last cards perfectly aligned
      translateX.value = Math.max(Math.min(nextTranslateX, 0), maxTranslateX);
    })
    .onEnd((event) => {
      const distance = CARD_WIDTH + CARD_SPACING;
      const rawIndex = -translateX.value / distance;
      const currentIndex = activeIndexShared.value;
      let targetIndex = Math.round(rawIndex);
      const dragDistance = translateX.value - gestureOffset.value;
      const dragProgress = dragDistance / distance;

      if (Math.abs(event.velocityX) > 500) {
        // Fast swipes advance in the direction of travel
        targetIndex = currentIndex + (dragDistance > 0 ? -1 : 1);
      } else if (dragProgress > SNAP_THRESHOLD) {
        targetIndex = currentIndex - 1;
      } else if (dragProgress < -SNAP_THRESHOLD) {
        targetIndex = currentIndex + 1;
      }

      targetIndex = Math.max(0, Math.min(cards.length - 1, targetIndex));
      snapToIndex(targetIndex);
    });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderCard = useCallback((card: PreviewCard, index: number) => {
    return (
      <View
        key={card.id}
        style={[
          styles.carouselCard,
          {
            width: CARD_WIDTH,
            height: cardHeight,
            marginRight: index !== cards.length - 1 ? CARD_SPACING : 0,
          },
        ]}
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
    );
  }, [cardHeight, cards.length]);

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
      <GestureDetector gesture={panGesture}>
        <View style={{ overflow: 'hidden' }}>
          <Animated.View
            style={[
              {
                flexDirection: 'row',
                paddingHorizontal: 24,
              },
              containerAnimatedStyle,
            ]}
          >
            {cards.map((card, index) => renderCard(card, index))}
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.paginationDots}>
        {renderPaginationDots()}
      </View>
    </View>
  );
};

export default SmoothCarousel;
