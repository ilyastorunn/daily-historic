import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectableChip } from '@/components/ui/selectable-chip';
import { EditorialCard } from '@/components/ui/editorial-card';
import { PeekCarousel } from '@/components/ui/peek-carousel';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';

const heroMoment = {
  badge: 'Today · 1920',
  title: 'Votes finally reach every woman',
  summary: 'The 19th Amendment is certified, extending suffrage across the United States.',
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
    summary: 'Brushstrokes that rebuilt Europe’s imagination.',
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
  const { colors, radius, spacing } = theme;
  const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.screen,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl + 48,
      gap: spacing.xxl,
    },
    section: {
      gap: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eyebrow: {
      fontFamily: sansFamily,
      fontSize: 13,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.textTertiary,
    },
    title: {
      fontFamily: serifFamily,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.6,
      color: colors.textPrimary,
    },
    helper: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      maxWidth: 320,
    },
    link: {
      fontFamily: sansFamily,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
      color: colors.textSecondary,
      opacity: 0.7,
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3,
    },
    collectionCardPressed: {
      transform: [{ scale: 0.98 }],
      shadowOpacity: 0.12,
    },
    collectionTextGroup: {
      flex: 1,
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
    collectionMeta: {
      fontFamily: sansFamily,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.3,
      opacity: 0.7,
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View>
            <Text style={styles.eyebrow}>Today</Text>
            <Text style={styles.title}>Your featured moment</Text>
            <Text style={styles.helper}>A single story, richly told. Tap through when you’re ready.</Text>
          </View>
          <EditorialCard
            badge={heroMoment.badge}
            title={heroMoment.title}
            summary={heroMoment.summary}
            meta={heroMoment.meta}
            imageSource={heroMoment.image}
            onPress={noop}
            actions={[
              { label: 'Continue', onPress: noop, variant: 'primary' },
              { label: 'Save', onPress: noop, variant: 'secondary' },
            ]}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrow}>Spotlight</Text>
              <Text style={styles.title}>For you</Text>
            </View>
            <Pressable onPress={noop} accessibilityRole="button">
              {({ pressed }) => (
                <Text style={[styles.link, pressed && { opacity: 0.5 }]}>See all</Text>
              )}
            </Pressable>
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
                actions={[{ label: 'Read', onPress: noop, variant: 'primary' }]}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrow}>Collections</Text>
              <Text style={styles.title}>Tune your digest</Text>
            </View>
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
                <Text style={styles.collectionMeta}>{`${entry.count} stories`}</Text>
                <IconSymbol name="chevron.right" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
