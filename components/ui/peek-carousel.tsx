import React, { useCallback, useMemo, useRef, useState } from 'react';
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

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0) {
      setContainerWidth((prev) => (Math.abs(nextWidth - prev) > 1 ? nextWidth : prev));
    }
  }, []);

  const extendedData: ExtendedItem<T>[] = useMemo(() => {
    const items: ExtendedItem<T>[] = data.map((value, index) => ({
      type: 'item',
      key: keyExtractor ? keyExtractor(value, index) : `${index}`,
      value,
    }));
    return [
      { type: 'spacer', key: 'peek-spacer-left' },
      ...items,
      { type: 'spacer', key: 'peek-spacer-right' },
    ];
  }, [data, keyExtractor]);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offset / fullItemWidth);
    const dataIndex = Math.min(Math.max(rawIndex - 1, 0), data.length - 1);
    if (onIndexChange) {
      onIndexChange(dataIndex);
    }
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
        {renderItem({ item: item.value, index: dataIndex, progress })}
      </Animated.View>
    );
  };

  return (
    <Animated.FlatList
      data={extendedData}
      keyExtractor={(item) => item.key}
      renderItem={renderExtendedItem}
      horizontal
      pagingEnabled={false}
      snapToInterval={fullItemWidth}
      decelerationRate={Platform.OS === 'ios' ? 0 : 0.98}
      onMomentumScrollEnd={handleMomentumEnd}
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
