import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '@/theme';
import {
  TIME_MACHINE_MAX_YEAR,
  TIME_MACHINE_MIN_YEAR,
} from '@/utils/time-machine';
import { getTimeMachineExplorerPalette, type TimeMachineExplorerPalette } from './explorer-palette';

const ITEM_WIDTH = 96;
const WHEEL_HEIGHT = 176;
const BAND_HEIGHT = 88;
const SELECTION_BAND_WIDTH = 136;
const EDGE_FADE_WIDTH = 80;

type UpdateSelectionOptions = {
  notifyChange?: boolean;
  triggerHaptic?: boolean;
};

type ScrollToYearOptions = {
  animated: boolean;
  notifyChange?: boolean;
  triggerHaptic?: boolean;
};

type YearSelectorProps = {
  initialYear: number;
  onYearChange?: (year: number) => void;
  onYearCommit: (year: number) => void;
  minYear?: number;
  maxYear?: number;
};

type YearWheelItemProps = {
  year: number;
  index: number;
  itemWidth: number;
  scrollX: Animated.Value;
  selected: boolean;
  palette: TimeMachineExplorerPalette;
  styles: ReturnType<typeof buildStyles>;
};

const YearWheelItem = React.memo(
  ({ year, index, itemWidth, scrollX, selected, palette, styles }: YearWheelItemProps) => {
    const inputRange = useMemo(
      () => [(index - 2) * itemWidth, index * itemWidth, (index + 2) * itemWidth],
      [index, itemWidth]
    );

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.16, 1, 0.16],
      extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.78, 1, 0.78],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [10, 0, 10],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.itemContainer,
          {
            width: itemWidth,
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <Text
          adjustsFontSizeToFit
          allowFontScaling={false}
          ellipsizeMode="clip"
          minimumFontScale={0.84}
          numberOfLines={1}
          style={[
            styles.itemLabel,
            selected ? styles.itemLabelSelected : styles.itemLabelUnselected,
            {
              color: selected ? palette.selectedText : palette.mutedText,
            },
          ]}
        >
          {year}
        </Text>
      </Animated.View>
    );
  }
);

YearWheelItem.displayName = 'YearWheelItem';

export const YearSelector: React.FC<YearSelectorProps> = ({
  initialYear,
  onYearChange,
  onYearCommit,
  minYear = TIME_MACHINE_MIN_YEAR,
  maxYear = TIME_MACHINE_MAX_YEAR,
}) => {
  const theme = useAppTheme();
  const palette = useMemo(() => getTimeMachineExplorerPalette(theme), [theme]);
  const styles = useMemo(() => buildStyles(), []);
  const { width: screenWidth } = useWindowDimensions();
  const initialClampedYear = Math.min(maxYear, Math.max(minYear, initialYear));

  const [selectedYear, setSelectedYear] = useState(initialClampedYear);
  const [listReady, setListReady] = useState(false);
  const [wheelWidth, setWheelWidth] = useState(screenWidth);
  const scrollX = useRef(new Animated.Value((initialClampedYear - minYear) * ITEM_WIDTH)).current;
  const listRef = useRef<FlatList<number> | null>(null);
  const selectedYearRef = useRef(initialClampedYear);
  const lastHapticYear = useRef(initialClampedYear);

  const years = useMemo(() => {
    const items: number[] = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      items.push(year);
    }
    return items;
  }, [maxYear, minYear]);

  const horizontalPadding = Math.max(0, (wheelWidth - ITEM_WIDTH) / 2);

  const clampYear = useCallback(
    (year: number) => Math.min(maxYear, Math.max(minYear, year)),
    [maxYear, minYear]
  );

  const yearToIndex = useCallback(
    (year: number) => clampYear(year) - minYear,
    [clampYear, minYear]
  );

  const offsetToYear = useCallback(
    (offset: number) => {
      const nearestIndex = Math.round(offset / ITEM_WIDTH);
      return clampYear(minYear + nearestIndex);
    },
    [clampYear, minYear]
  );

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => undefined);
    }
  }, []);

  const updateSelectedYear = useCallback(
    (year: number, options?: UpdateSelectionOptions) => {
      const nextYear = clampYear(year);
      const notifyChange = options?.notifyChange ?? true;
      const shouldTriggerHaptic = options?.triggerHaptic ?? true;
      const didChange = nextYear !== selectedYearRef.current;

      if (didChange) {
        selectedYearRef.current = nextYear;
        setSelectedYear(nextYear);

        if (notifyChange) {
          onYearChange?.(nextYear);
        }
      }

      if (!shouldTriggerHaptic) {
        lastHapticYear.current = nextYear;
        return;
      }

      if (didChange && nextYear !== lastHapticYear.current) {
        lastHapticYear.current = nextYear;
        triggerHaptic();
      }
    },
    [clampYear, onYearChange, triggerHaptic]
  );

  const scrollToYear = useCallback(
    (year: number, options: ScrollToYearOptions) => {
      const nextYear = clampYear(year);
      const nextOffset = yearToIndex(nextYear) * ITEM_WIDTH;
      updateSelectedYear(nextYear, {
        notifyChange: options.notifyChange,
        triggerHaptic: options.triggerHaptic,
      });

      if (!options.animated) {
        scrollX.setValue(nextOffset);
      }

      listRef.current?.scrollToOffset({
        offset: nextOffset,
        animated: options.animated,
      });
    },
    [clampYear, scrollX, updateSelectedYear, yearToIndex]
  );

  useEffect(() => {
    const nextYear = clampYear(initialYear);

    if (nextYear === selectedYearRef.current) {
      return;
    }

    updateSelectedYear(nextYear, { notifyChange: false, triggerHaptic: false });
    scrollX.setValue(yearToIndex(nextYear) * ITEM_WIDTH);

    if (!listReady) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: yearToIndex(nextYear) * ITEM_WIDTH,
        animated: false,
      });
    });
  }, [clampYear, initialYear, listReady, scrollX, updateSelectedYear, yearToIndex]);

  useEffect(() => {
    if (!listReady) {
      return;
    }

    requestAnimationFrame(() => {
      const offset = yearToIndex(selectedYearRef.current) * ITEM_WIDTH;
      scrollX.setValue(offset);
      listRef.current?.scrollToOffset({
        offset,
        animated: false,
      });
    });
  }, [listReady, scrollX, wheelWidth, yearToIndex]);

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          updateSelectedYear(offsetToYear(event.nativeEvent.contentOffset.x));
        },
      }),
    [offsetToYear, scrollX, updateSelectedYear]
  );

  const handleAccessibilityAction = useCallback(
    (actionName: string) => {
      if (actionName === 'activate') {
        onYearCommit(selectedYearRef.current);
        return;
      }

      const delta = actionName === 'increment' ? 1 : -1;
      scrollToYear(selectedYearRef.current + delta, {
        animated: true,
      });
    },
    [onYearCommit, scrollToYear]
  );

  const handleWheelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextWidth = event.nativeEvent.layout.width;
      if (nextWidth > 0 && nextWidth !== wheelWidth) {
        setWheelWidth(nextWidth);
      }
    },
    [wheelWidth]
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<number>) => (
      <YearWheelItem
        year={item}
        index={index}
        itemWidth={ITEM_WIDTH}
        scrollX={scrollX}
        selected={item === selectedYear}
        palette={palette}
        styles={styles}
      />
    ),
    [palette, scrollX, selectedYear, styles]
  );

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Year selector, ${selectedYear}`}
        accessibilityHint="Swipe left or right to adjust the year, then double tap to open it."
        accessibilityActions={[
          { name: 'increment', label: 'Next year' },
          { name: 'decrement', label: 'Previous year' },
          { name: 'activate', label: 'Travel to this year' },
        ]}
        onAccessibilityAction={({ nativeEvent }) => handleAccessibilityAction(nativeEvent.actionName)}
        onLayout={handleWheelLayout}
        style={styles.wheelShell}
      >
        <View
          pointerEvents="none"
          style={[
            styles.selectionBand,
            {
              width: SELECTION_BAND_WIDTH,
              backgroundColor: palette.selectionBand,
              borderColor: palette.selectionBorder,
            },
          ]}
        />

        <Animated.FlatList
          accessible={false}
          bounces={false}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPadding }]}
          data={years}
          decelerationRate={Platform.OS === 'ios' ? 0.998 : 0.985}
          disableIntervalMomentum={false}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          horizontal
          initialNumToRender={11}
          initialScrollIndex={yearToIndex(initialClampedYear)}
          keyExtractor={(item) => String(item)}
          onLayout={() => setListReady(true)}
          onScroll={handleScroll}
          ref={(value) => {
            listRef.current = value as FlatList<number> | null;
          }}
          renderItem={renderItem}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={ITEM_WIDTH}
          style={styles.list}
        />

        <LinearGradient
          colors={[palette.edgeFadeOpaque, palette.edgeFadeTransparent]}
          locations={[0, 1]}
          pointerEvents="none"
          style={[styles.edgeFade, styles.edgeFadeLeft, { width: EDGE_FADE_WIDTH }]}
        />
        <LinearGradient
          colors={[palette.edgeFadeTransparent, palette.edgeFadeOpaque]}
          locations={[0, 1]}
          pointerEvents="none"
          style={[styles.edgeFade, styles.edgeFadeRight, { width: EDGE_FADE_WIDTH }]}
        />
      </View>
    </View>
  );
};

const buildStyles = () => {
  return StyleSheet.create({
    container: {
      width: '100%',
      alignItems: 'stretch',
    },
    wheelShell: {
      height: WHEEL_HEIGHT,
      justifyContent: 'center',
    },
    selectionBand: {
      position: 'absolute',
      alignSelf: 'center',
      top: (WHEEL_HEIGHT - BAND_HEIGHT) / 2,
      height: BAND_HEIGHT,
      borderRadius: 22,
      borderWidth: 1,
    },
    list: {
      flexGrow: 0,
      height: WHEEL_HEIGHT,
    },
    listContent: {
      alignItems: 'center',
    },
    itemContainer: {
      height: WHEEL_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemLabel: {
      width: '100%',
      textAlign: 'center',
      includeFontPadding: false,
      fontVariant: ['tabular-nums'],
      letterSpacing: -0.8,
    },
    itemLabelSelected: {
      fontSize: 42,
      lineHeight: 46,
      fontWeight: '600',
    },
    itemLabelUnselected: {
      fontSize: 34,
      lineHeight: 38,
      fontWeight: Platform.OS === 'ios' ? '500' : '400',
    },
    edgeFade: {
      position: 'absolute',
      top: 0,
      bottom: 0,
    },
    edgeFadeLeft: {
      left: 0,
    },
    edgeFadeRight: {
      right: 0,
    },
  });
};

export default YearSelector;
