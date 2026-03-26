import { Image, StyleSheet, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

type DecorativeIllustrationProps = {
  source: ImageSourcePropType;
  width?: number;
  widthRatio?: number;
  minWidth?: number;
  maxWidth?: number;
  height?: number;
  aspectRatio?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  opacity?: number;
  zIndex?: number;
  style?: StyleProp<ImageStyle>;
};

const clamp = (value: number, min?: number, max?: number) => {
  let next = value;

  if (typeof min === 'number') {
    next = Math.max(next, min);
  }

  if (typeof max === 'number') {
    next = Math.min(next, max);
  }

  return next;
};

const DecorativeIllustration = ({
  source,
  width,
  widthRatio,
  minWidth,
  maxWidth,
  height,
  aspectRatio,
  top,
  bottom,
  left,
  right,
  opacity = 1,
  zIndex,
  style,
}: DecorativeIllustrationProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const asset = Image.resolveAssetSource(source);
  const hasExplicitPosition =
    top !== undefined || bottom !== undefined || left !== undefined || right !== undefined;

  const resolvedWidth = clamp(
    Math.round(widthRatio ? windowWidth * widthRatio : width ?? asset.width ?? 160),
    minWidth,
    maxWidth
  );

  const resolvedAspectRatio =
    aspectRatio ??
    (asset.width && asset.height ? asset.width / asset.height : undefined);

  return (
    <Image
      accessible={false}
      resizeMode="contain"
      source={source}
      style={[
        styles.image,
        hasExplicitPosition && styles.positioned,
        {
          width: resolvedWidth,
          opacity,
          zIndex,
        },
        resolvedAspectRatio ? { aspectRatio: resolvedAspectRatio } : null,
        height ? { height } : null,
        top !== undefined ? { top } : null,
        bottom !== undefined ? { bottom } : null,
        left !== undefined ? { left } : null,
        right !== undefined ? { right } : null,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
  positioned: {
    position: 'absolute',
  },
});

export default DecorativeIllustration;
