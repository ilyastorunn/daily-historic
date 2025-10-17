import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { colors, radiusScale, spacingScale } from './styles';

const sources = {
  armstrong: { uri: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Neil_Armstrong_pose.jpg' },
  edison: { uri: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Thomas_Edison2.jpg' },
  cesar: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Vincenzo_Camuccini_-_Morte_di_Cesare.jpg',
  },
  empire: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Thomas_Cole_-_The_Course_of_Empire_Destruction_1836.jpg',
  },
};

const HeroCollage = () => (
  <View style={styles.wrapper}>
    <Image source={sources.armstrong} style={[styles.tile, styles.tileArmstrong]} contentFit="cover" />
    <Image source={sources.edison} style={[styles.tile, styles.tileEdison]} contentFit="cover" />
    <Image source={sources.cesar} style={[styles.tile, styles.tileCesar]} contentFit="cover" />
    <Image source={sources.empire} style={[styles.tile, styles.tileEmpire]} contentFit="cover" />
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 340,
    height: 340,
    alignSelf: 'center',
    marginBottom: spacingScale.md,
  },
  tile: {
    position: 'absolute',
    borderRadius: radiusScale.xl,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  tileArmstrong: {
    top: 0,
    left: 0,
    width: '56%',
    height: 220,
    transform: [{ rotate: '-4deg' }],
  },
  tileEdison: {
    top: spacingScale.md,
    right: spacingScale.xs,
    width: '42%',
    height: 130,
    borderRadius: radiusScale.lg,
    transform: [{ rotate: '6deg' }],
  },
  tileCesar: {
    left: '42%',
    top: 160,
    width: '45%',
    height: 190,
    borderRadius: radiusScale.lg,
    transform: [{ rotate: '-2deg' }],
  },
  tileEmpire: {
    bottom: 0,
    left: spacingScale.sm,
    width: '88%',
    height: 180,
    transform: [{ rotate: '3deg' }],
  },
});

export default memo(HeroCollage);
