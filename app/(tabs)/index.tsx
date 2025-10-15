import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectableChip } from '@/components/ui/selectable-chip';
import { EditorialCard } from '@/components/ui/editorial-card';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';

const heroMoment = {
  badge: '1920 · Today',
  title: 'Votes finally reach every woman',
  summary: 'The 19th Amendment is certified; millions gain the ballot.',
  meta: 'Washington, D.C.',
  image: require('@/pics/960px-Neil_Armstrong_pose.jpg'),
};

const spotlightMoments = [
  {
    id: 'moon-landing',
    badge: '1969',
    title: 'First footsteps on lunar soil',
    summary: 'Neil Armstrong steps onto the Moon and shifts the horizon of exploration.',
    meta: 'Sea of Tranquility',
    image: require('@/pics/960px-Neil_Armstrong_pose.jpg'),
  },
  {
    id: 'empire-painting',
    badge: '1836',
    title: 'An empire in twilight',
    summary: 'Thomas Cole captures a civilization collapsing under its own weight.',
    meta: 'New York, Cole Collection',
    image: require('@/pics/Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg'),
  },
  {
    id: 'caesar-assassination',
    badge: '44 BC',
    title: 'The Ides reverberate',
    summary: 'Caesar falls in the Senate, and Rome hurtles toward empire.',
    meta: 'Curia Pompeia, Rome',
    image: require('@/pics/Vincenzo_Camuccini_-_La_morte_di_Cesare.jpg'),
  },
];

const collectionFilters = [
  { id: 'art', label: 'Art & Design' },
  { id: 'science', label: 'Science' },
  { id: 'culture', label: 'Culture' },
  { id: 'archives', label: 'Archives' },
];

const collectionEntries = [
  {
    id: 'italian-renaissance',
    tag: 'art',
    title: 'Italian Renaissance',
    summary: "Brushstrokes that rebuilt Europe's imagination.",
    count: 12,
  },
  {
    id: 'deep-sea-mapping',
    tag: 'science',
    title: 'Deep-sea mapping',
    summary: 'The pioneers who charted the ocean floor.',
    count: 7,
  },
  {
    id: 'voices-of-change',
    tag: 'culture',
    title: 'Voices of change',
    summary: 'Civil rights speeches that still resonate today.',
    count: 9,
  },
  {
    id: 'letters-home',
    tag: 'archives',
    title: 'Letters from the front',
    summary: 'Intimate dispatches that travelled across war lines.',
    count: 5,
  },
];

const noop = () => undefined;

const createStyles = (theme: ThemeDefinition) => {
  const { colors, palette, radius, spacing, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.appBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.screen,
    },
    scrollContent: {
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl + spacing.lg,
      gap: spacing.xxl,
    },
    heroSurface: {
      borderRadius: radius.xl,
      overflow: 'hidden',
      backgroundColor: palette.midnight,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.25,
      shadowRadius: 32,
      elevation: 8,
      gap: spacing.xl,
    },
    heroIntro: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      gap: spacing.xs,
    },
    heroEyebrow: {
      color: colors.accentMuted,
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroBrand: {
      color: colors.textInverse,
      fontFamily: serifFamily,
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.4,
    },
    heroHeading: {
      color: colors.textInverse,
      fontFamily: serifFamily,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.4,
    },
    heroBody: {
      color: colors.accentMuted,
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      maxWidth: 320,
    },
    heroMomentCard: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.xl,
      borderRadius: radius.card,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.heroBorder,
      backgroundColor: 'rgba(18, 16, 12, 0.55)',
    },
    heroArtwork: {
      height: 220,
      position: 'relative',
      overflow: 'hidden',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroArtworkOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(12, 9, 5, 0.45)',
    },
    heroMomentContent: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    heroMomentBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(247, 241, 231, 0.35)',
      color: colors.accentMuted,
      fontFamily: sansFamily,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroMomentTitle: {
      color: colors.surface,
      fontFamily: serifFamily,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.4,
    },
    heroMomentSummary: {
      color: colors.accentMuted,
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
    },
    heroMomentMeta: {
      color: colors.accentMuted,
      fontFamily: sansFamily,
      fontSize: 13,
      letterSpacing: 0.2,
    },
    heroActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    primaryAction: {
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.accentPrimary,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.32,
      shadowRadius: 20,
      elevation: 6,
    },
    primaryActionPressed: {
      opacity: 0.9,
    },
    primaryActionLabel: {
      color: colors.surface,
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    ghostAction: {
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(247, 241, 231, 0.35)',
      backgroundColor: 'transparent',
    },
    ghostActionPressed: {
      opacity: 0.85,
    },
    ghostActionLabel: {
      color: colors.surface,
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    section: {
      gap: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
    },
    sectionTitle: {
      fontFamily: serifFamily,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.3,
      color: colors.textPrimary,
    },
    sectionHint: {
      fontFamily: sansFamily,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    collectionList: {
      gap: spacing.md,
    },
    collectionCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 22,
      elevation: 4,
    },
    collectionCardPressed: {
      transform: [{ scale: 0.98 }],
      shadowOpacity: 0.14,
    },
    collectionTextGroup: {
      gap: spacing.xs,
    },
    collectionTitle: {
      fontFamily: serifFamily,
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.4,
      color: colors.textPrimary,
    },
    collectionSummary: {
      fontFamily: sansFamily,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    collectionFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    collectionCountBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
    },
    collectionCountLabel: {
      fontFamily: sansFamily,
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
      letterSpacing: 0.2,
    },
    collectionChevron: {
      marginLeft: spacing.lg,
    },
  });
};

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeFilter, setActiveFilter] = useState(collectionFilters[0]?.id ?? 'art');

  const filteredCollections = useMemo(
    () => collectionEntries.filter((entry) => entry.tag === activeFilter),
    [activeFilter]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSurface}>
          <View style={styles.heroIntro}>
            <Text style={styles.heroEyebrow}>Today&#39;s edition</Text>
            <Text style={styles.heroBrand}>Daily Historic</Text>
            <Text style={styles.heroHeading}>Headlines waiting for you.</Text>
            <Text style={styles.heroBody}>
              We gather the discoveries, revolutions, and acts of courage that keep history in motion.
            </Text>
          </View>

          <View style={styles.heroMomentCard}>
            <View style={styles.heroArtwork}>
              <Image source={heroMoment.image} style={styles.heroImage} contentFit="cover" transition={200} />
              <View style={styles.heroArtworkOverlay} />
            </View>

            <View style={styles.heroMomentContent}>
              <Text style={styles.heroMomentBadge}>{heroMoment.badge}</Text>
              <Text style={styles.heroMomentTitle}>{heroMoment.title}</Text>
              <Text style={styles.heroMomentSummary}>{heroMoment.summary}</Text>
              <Text style={styles.heroMomentMeta}>{heroMoment.meta}</Text>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={noop}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.primaryAction,
                    pressed && styles.primaryActionPressed,
                  ]}
                >
                  <Text style={styles.primaryActionLabel}>Continue</Text>
                </Pressable>

                <Pressable
                  onPress={noop}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.ghostAction,
                    pressed && styles.ghostActionPressed,
                  ]}
                >
                  <Text style={styles.ghostActionLabel}>Preview</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spotlight digest</Text>
            <Text style={styles.sectionHint}>Swipe to explore</Text>
          </View>
          <PeekCarousel
            data={spotlightMoments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EditorialCard
                badge={item.badge}
                title={item.title}
                summary={item.summary}
                meta={item.meta}
                imageSource={item.image}
                onPress={noop}
                actions={[{ label: 'Preview', onPress: noop, variant: 'secondary' }]}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <Text style={styles.sectionHint}>Shape your digest</Text>
          </View>

          <View style={styles.chipsRow}>
            {collectionFilters.map((filter) => (
              <SelectableChip
                key={filter.id}
                label={filter.label}
                selected={filter.id === activeFilter}
                onPress={() => setActiveFilter(filter.id)}
                accessibilityHint="Toggle collection focus"
              />
            ))}
          </View>

          <View style={styles.collectionList}>
            {filteredCollections.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={noop}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.collectionCard,
                  pressed && styles.collectionCardPressed,
                ]}
              >
                <View style={styles.collectionTextGroup}>
                  <Text style={styles.collectionTitle}>{entry.title}</Text>
                  <Text style={styles.collectionSummary}>{entry.summary}</Text>
                </View>

                <View style={styles.collectionFooter}>
                  <View style={styles.collectionCountBadge}>
                    <Text style={styles.collectionCountLabel}>{`${entry.count} stories`}</Text>
                  </View>
                  <IconSymbol
                    name="chevron.right"
                    size={18}
                    color={theme.colors.textSecondary}
                    style={styles.collectionChevron}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
