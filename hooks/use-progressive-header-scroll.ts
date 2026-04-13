import { useMemo } from 'react';

import Animated, {
  type SharedValue,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

type ScrollMetrics = {
  y: number;
  viewportHeight: number;
  contentHeight: number;
};

type UseProgressiveHeaderScrollOptions = {
  onScrollMetrics?: (metrics: ScrollMetrics) => void;
};

type UseProgressiveHeaderScrollResult = {
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
  scrollY: SharedValue<number>;
};

export const useProgressiveHeaderScroll = (
  options?: UseProgressiveHeaderScrollOptions
): UseProgressiveHeaderScrollResult => {
  const scrollY = useSharedValue(0);
  const onScrollMetrics = options?.onScrollMetrics;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = Math.max(0, event.contentOffset.y);
      scrollY.value = y;

      if (!onScrollMetrics) {
        return;
      }

      runOnJS(onScrollMetrics)({
        y,
        viewportHeight: event.layoutMeasurement.height,
        contentHeight: event.contentSize.height,
      });
    },
  });

  return useMemo(
    () => ({
      onScroll,
      scrollY,
    }),
    [onScroll, scrollY]
  );
};
