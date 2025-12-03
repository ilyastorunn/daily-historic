import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { useAppTheme, type ThemeDefinition } from '@/theme';

type PeekCarouselRenderItemInfo<T> = {
  item: T;
  index: number;
  progress: Animated.AnimatedInterpolation<string | number>;
};

type PeekCarouselProps<T> = {
  data: T[];
  renderItem: (info: PeekCarouselRenderItemInfo<T>) => React.ReactElement;
  keyExtractor?: (item: T, index: number) => string;
  onIndexChange?: (index: number) => void;
  itemWidth?: number;
  gap?: number;
  testID?: string;
};

type SpacerItem = { type: 'spacer'; key: string };
type ValueItem<T> = { type: 'item'; key: string; value: T };
type ExtendedItem<T> = SpacerItem | ValueItem<T>;

const { width: screenWidth } = Dimensions.get('window');

const createStyles = (theme: ThemeDefinition) =>
  StyleSheet.create({
    listContent: {
      paddingVertical: theme.spacing.lg,
    },
    itemContainer: {
      justifyContent: 'flex-start',
    },
    spacer: {
      height: 1,
    },
  });

export const PeekCarousel = <T,>({
  data,
  renderItem,
  keyExtractor,
  onIndexChange,
  itemWidth,
  gap,
  testID,
}: PeekCarouselProps<T>): React.ReactElement => {
  const theme = useAppTheme();
  const { spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [containerWidth, setContainerWidth] = useState(screenWidth);

  const effectiveWidth = containerWidth || screenWidth;
  const computedCardWidth = itemWidth ?? Math.round(effectiveWidth * 0.78);
  const cardWidth = Math.min(computedCardWidth, effectiveWidth);
  const itemGap = gap ?? spacing.lg;
  const fullItemWidth = cardWidth + itemGap;
  const sideInset = Math.max((effectiveWidth - cardWidth) / 2, 0);
  const spacerWidth = Math.max(sideInset - itemGap / 2, 0);

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<ExtendedItem<T>>>(null);
  const isScrolling = useRef(false);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0) {
      setContainerWidth((prev) => (Math.abs(nextWidth - prev) > 1 ? nextWidth : prev));
    }
  }, []);

  // Create infinite loop by triplicating data
  const extendedData: ExtendedItem<T>[] = useMemo(() => {
    if (data.length === 0) return [];

    const items: ExtendedItem<T>[] = data.map((value, index) => ({
      type: 'item',
      key: keyExtractor ? keyExtractor(value, index) : `${index}`,
      value,
    }));

    // Triplicate items for infinite scroll
    const triplicatedItems = [
      ...items.map((item, idx) => ({ ...item, key: `prev-${item.key}` })),
      ...items,
      ...items.map((item, idx) => ({ ...item, key: `next-${item.key}` })),
    ];

    return [
      { type: 'spacer', key: 'peek-spacer-left' },
      ...triplicatedItems,
      { type: 'spacer', key: 'peek-spacer-right' },
    ];
  }, [data, keyExtractor]);

  // Initialize scroll position to middle set
  useEffect(() => {
    if (data.length > 0 && flatListRef.current) {
      const middleSetStartIndex = data.length + 1; // +1 for left spacer
      const initialOffset = middleSetStartIndex * fullItemWidth;

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialOffset,
          animated: false,
        });
      }, 100);
    }
  }, [data.length, fullItemWidth]);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (data.length === 0) return;

    const offset = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offset / fullItemWidth);

    // Account for left spacer
    const indexWithinTriplicatedData = rawIndex - 1;

    // Calculate which set we're in (prev, middle, next)
    const totalItemsCount = data.length * 3;
    const setSize = data.length;

    // Get position within the triplicated items
    let positionInSet = indexWithinTriplicatedData % setSize;
    if (positionInSet < 0) positionInSet += setSize;

    // Check if we need to jump to maintain infinite loop
    if (indexWithinTriplicatedData < setSize / 2) {
      // Near the start, jump to middle set
      const newOffset = (setSize + indexWithinTriplicatedData + 1) * fullItemWidth;
      flatListRef.current?.scrollToOffset({
        offset: newOffset,
        animated: false,
      });
    } else if (indexWithinTriplicatedData >= setSize * 2.5) {
      // Near the end, jump to middle set
      const newOffset = (setSize + indexWithinTriplicatedData - setSize * 2 + 1) * fullItemWidth;
      flatListRef.current?.scrollToOffset({
        offset: newOffset,
        animated: false,
      });
    }

    if (onIndexChange) {
      onIndexChange(positionInSet);
    }

    isScrolling.current = false;
  };

  const handleScrollBeginDrag = () => {
    isScrolling.current = true;
  };

  const renderExtendedItem = ({ item, index }: { item: ExtendedItem<T>; index: number }) => {
    if (item.type === 'spacer') {
      return <View style={[styles.spacer, { width: spacerWidth + itemGap / 2 }]} />;
    }

    const dataIndex = index - 1;
    const inputRange = [
      (dataIndex - 1) * fullItemWidth,
      dataIndex * fullItemWidth,
      (dataIndex + 1) * fullItemWidth,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [14, 0, 14],
      extrapolate: 'clamp',
    });

    const progress = scrollX.interpolate({
      inputRange,
      outputRange: [1, 0, -1],
      extrapolate: 'clamp',
    });

    // Calculate the original data index for rendering
    const originalDataIndex = dataIndex % data.length;

    return (
      <Animated.View
        style={[
          styles.itemContainer,
          {
            width: cardWidth,
            marginHorizontal: itemGap / 2,
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        {renderItem({ item: item.value, index: originalDataIndex, progress })}
      </Animated.View>
    );
  };

  return (
    <Animated.FlatList
      ref={flatListRef}
      data={extendedData}
      keyExtractor={(item) => item.key}
      renderItem={renderExtendedItem}
      horizontal
      pagingEnabled={false}
      snapToInterval={fullItemWidth}
      decelerationRate={Platform.OS === 'ios' ? 0 : 0.98}
      onMomentumScrollEnd={handleMomentumEnd}
      onScrollBeginDrag={handleScrollBeginDrag}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.listContent}
      onLayout={handleLayout}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
      testID={testID}
    />
  );
};
