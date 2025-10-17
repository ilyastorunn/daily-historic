import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserContext } from '@/contexts/user-context';
import { useAppTheme } from '@/theme';
import type { ThemeDefinition } from '@/theme/tokens';
import { createLinearGradientSource } from '@/utils/gradient';

type TimelineFilter = 'today' | 'for-you' | 'archives';

type EventCard = {
  id: string;
  year: string;
  title: string;
  summary: string;
  location: string;
  imageUri: string;
};

type ViewableItemsChangedParams = {
  viewableItems: { item?: EventCard; index?: number }[];
};

const TIMELINE_OPTIONS: { id: TimelineFilter; label: string }[] = [
  { id: 'today', label: "Today's Stories" },
  { id: 'for-you', label: 'For You' },
  { id: 'archives', label: 'Archive Highlights' },
];

const HERO_MOMENT: {
  badge: string;
  title: string;
  summary: string;
  meta: string;
  image: ImageSource;
} = {
  badge: '1969 · Today',
  title: 'First footsteps on the Moon',
  summary: "Neil Armstrong's first step expands humanity's horizon.",
  meta: 'Sea of Tranquility, Moon',
  image: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Neil_Armstrong_pose.jpg',
  },
};

const noop = () => undefined;

const createHeroCopy = (displayName?: string) => {
  if (!displayName) {
    return "Step into today's defining chapter.";
  }
  return `${displayName}, step into today's defining chapter.`;
};

const withOpacity = (hexColor: string, opacity: number) => {
  const normalized = hexColor.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const buildStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
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
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl + 20,
      gap: spacing.xxl,
    },
    heroSurface: {
      gap: spacing.card,
    },
    heroHeader: {
      gap: spacing.xs,
    },
    heroKicker: {
      color: withOpacity(colors.textPrimary, 0.6),
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: colors.textPrimary,
      fontFamily: serifFamily,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    heroLead: {
      color: colors.textSecondary,
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: 24,
      maxWidth: 320,
    },
    heroMomentCard: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: withOpacity(colors.textPrimary, 0.05),
      backgroundColor: colors.heroBackground,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
    heroArtwork: {
      height: 216,
      position: 'relative',
      overflow: 'hidden',
    },
    heroArtworkBackground: {
      ...StyleSheet.absoluteFillObject,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroArtworkOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    heroMomentContent: {
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    heroMomentBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: withOpacity(colors.accentPrimary, 0.3),
      color: colors.accentPrimary,
      fontFamily: sansFamily,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroMomentTitle: {
      color: colors.textPrimary,
      fontFamily: serifFamily,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.4,
    },
    heroMomentSummary: {
      color: colors.textSecondary,
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      maxWidth: 320,
    },
    heroMomentMeta: {
      color: colors.textSecondary,
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      letterSpacing: 0.2,
    },
    heroActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 16,
    },
    primaryAction: {
      paddingHorizontal: spacing.card,
      paddingVertical: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.accentPrimary,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 4,
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
      paddingVertical: 12,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: withOpacity(colors.textSecondary, 0.2),
      backgroundColor: 'transparent',
    },
    ghostActionPressed: {
      opacity: 0.85,
    },
    ghostActionLabel: {
      color: colors.textPrimary,
      fontFamily: sansFamily,
      fontSize: 15,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    heroControls: {
      gap: spacing.sm,
    },
    controlsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    timelineChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    timelineChipActive: {
      backgroundColor: colors.surfaceSubtle,
      borderColor: colors.borderSubtle,
    },
    timelineChipText: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      color: colors.textSecondary,
    },
    timelineChipTextActive: {
      color: colors.textPrimary,
    },
    signOutButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    signOutButtonPressed: {
      opacity: 0.85,
    },
    signOutText: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      color: colors.textSecondary,
    },
    surfaceSection: {
      width: '100%',
      gap: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      letterSpacing: -0.4,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
    },
    cardWrapper: {
      borderRadius: radius.card,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
      width: '100%',
    },
    cardImage: {
      height: 220,
      justifyContent: 'flex-end',
    },
    cardImageOverlay: {
      backgroundColor: 'rgba(247, 244, 238, 0.82)',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    cardYearBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSubtle,
    },
    cardYearText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.textSecondary,
    },
    cardTitle: {
      color: colors.surface,
      fontFamily: serifFamily,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.4,
    },
    cardSubtitle: {
      color: colors.accentMuted,
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
    },
    cardBody: {
      padding: spacing.card,
      gap: spacing.sm,
    },
    cardSummary: {
      color: colors.textSecondary,
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    cardMeta: {
      color: colors.textTertiary,
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
    },
    pagerDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    pagerDot: {
      width: 8,
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.borderSubtle,
    },
    pagerDotActive: {
      backgroundColor: colors.accentPrimary,
      width: 24,
    },
    quickSection: {
      gap: spacing.md,
      width: '100%',
    },
    quickCard: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      gap: spacing.sm,
    },
    quickTitle: {
      color: colors.textPrimary,
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      letterSpacing: -0.3,
    },
    quickCopy: {
      color: colors.textSecondary,
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
  });
};

const EVENT_LIBRARY: Record<TimelineFilter, EventCard[]> = {
  today: [
    {
      id: 'apollo-11',
      year: '1969',
      title: 'First Step on the Moon',
      summary:
        'Neil Armstrong and Buzz Aldrin step onto the lunar surface, opening a new era of exploration.',
      location: 'Sea of Tranquility, Moon',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Aldrin_Apollo_11_original.jpg/640px-Aldrin_Apollo_11_original.jpg',
    },
    {
      id: 'printing-press',
      year: '1455',
      title: "Gutenberg's Revolution",
      summary:
        "Johannes Gutenberg's Bible accelerates book production and carries ideas across continents.",
      location: 'Mainz, Holy Roman Empire',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg/640px-Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg',
    },
    {
      id: 'rosa-parks',
      year: '1955',
      title: "Rosa Parks' Stand",
      summary:
        "Rosa Parks refuses to surrender her seat, igniting the Montgomery Bus Boycott and fuelling the civil rights movement.",
      location: 'Montgomery, Alabama',
      imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Rosaparks_bus.jpg/640px-Rosaparks_bus.jpg',
    },
  ],
  'for-you': [
    {
      id: 'curie-nobel',
      year: '1903',
      title: 'Curie Nobel Triumph',
      summary:
        "Marie and Pierre Curie are honoured for their research into radioactivity, boosting women's visibility in science.",
      location: 'Stockholm, Sweden',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Marie_Curie_c1920.jpg/640px-Marie_Curie_c1920.jpg',
    },
    {
      id: 'istanbul-convention',
      year: '1936',
      title: 'Montreux Convention Secures the Straits',
      summary:
        "The Montreux agreement strengthens Turkey's control of the straits and reshapes Black Sea balance.",
      location: 'Montreux, Switzerland',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Montreux_Palace.jpg/640px-Montreux_Palace.jpg',
    },
    {
      id: 'voyager-golden',
      year: '1977',
      title: 'Voyager Golden Record',
      summary:
        "Earth's sounds are etched onto the Voyager probes, sending a cosmic greeting to future listeners.",
      location: 'Cape Canaveral, USA',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Voyager_Golden_Record.jpg/640px-Voyager_Golden_Record.jpg',
    },
  ],
  archives: [
    {
      id: 'magna-carta',
      year: '1215',
      title: 'Signing of Magna Carta',
      summary:
        "English barons force the charter that limits royal power, laying a cornerstone for modern law.",
      location: 'Runnymede, England',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Magna_Carta_%28British_Library_Cotton_MS_Augustus_II.106%29.jpg/640px-Magna_Carta_%28British_Library_Cotton_MS_Augustus_II.106%29.jpg',
    },
    {
      id: 'hagia-sophia',
      year: '537',
      title: 'Dome of Hagia Sophia',
      summary:
        "Emperor Justinian proclaims 'Solomon, I have surpassed you' as Hagia Sophia crowns Byzantine architecture.",
      location: 'Constantinople',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Hagia_Sophia_Mars_2013.jpg/640px-Hagia_Sophia_Mars_2013.jpg',
    },
    {
      id: 'catalhoyuk',
      year: '7400 BCE',
      title: 'Life at Catalhoyuk',
      summary:
        "Frescoes from one of Anatolia's earliest settlements reveal the rituals of a Neolithic community.",
      location: 'Konya Plain, Anatolia',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Replica_of_a_Catalh%C3%B6y%C3%BCk_house.jpg/640px-Replica_of_a_Catalh%C3%B6y%C3%BCk_house.jpg',
    },
  ],
};

const viewabilityConfig = {
  itemVisiblePercentThreshold: 60,
};

const DashboardScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { width } = useWindowDimensions();

  const { profile, signOut } = useUserContext();
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('today');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const heroIntro = useRef(new Animated.Value(0)).current;

  const triggerLightHaptic = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    Animated.timing(heroIntro, {
      toValue: 1,
      duration: 500,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroIntro]);

  const heroScale = useMemo(
    () =>
      heroIntro.interpolate({
        inputRange: [0, 1],
        outputRange: [0.98, 1],
      }),
    [heroIntro]
  );

  const heroAnimatedStyle = useMemo(
    () => ({
      opacity: heroIntro,
      transform: [{ scale: heroScale }],
    }),
    [heroIntro, heroScale]
  );

  const heroBackdropGradient = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: '#EAE8E3' },
          { offset: 100, color: '#D5D0C7' },
        ],
        { x1: 0, y1: 0, x2: 1, y2: 1 }
      ),
    []
  );

  const heroOverlayGradient = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(28, 26, 22, 0.1)' },
          { offset: 100, color: 'rgba(17, 14, 10, 0.45)' },
        ],
        { x1: 0.1, y1: 0, x2: 0.9, y2: 1 }
      ),
    []
  );

  const activeCards = useMemo(() => EVENT_LIBRARY[activeFilter], [activeFilter]);
  const activeCardsLength = activeCards.length;

  const cardWidth = useMemo(() => {
    const horizontalPadding = theme.spacing.xl * 2;
    const maxWidth = 360;
    return Math.min(width - horizontalPadding, maxWidth);
  }, [width, theme.spacing.xl]);

  const handleFilterPress = useCallback(
    (option: TimelineFilter) => {
      triggerLightHaptic();
      setActiveFilter(option);
    },
    [triggerLightHaptic]
  );

  useEffect(() => {
    setActiveCardIndex(0);
  }, [activeFilter]);

  const handleViewableItemsChanged = useRef((params: ViewableItemsChangedParams) => {
    const firstVisible = params.viewableItems.find((item) => item.index !== undefined);
    if (firstVisible?.index !== undefined) {
      setActiveCardIndex(firstVisible.index);
    }
  });

  const keyExtractor = useCallback((item: EventCard) => item.id, []);

  const renderCard = useCallback(
    ({ item, index }: { item: EventCard; index: number }) => {
      const isLastItem = index === activeCardsLength - 1;

      return (
        <View
          style={{
            width: cardWidth,
            marginRight: isLastItem ? 0 : theme.spacing.lg,
          }}
        >
          <View style={styles.cardWrapper}>
            <ImageBackground source={{ uri: item.imageUri }} style={styles.cardImage} resizeMode="cover">
              <View style={styles.cardImageOverlay}>
                <View style={styles.cardYearBadge}>
                  <Text style={styles.cardYearText}>{item.year}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.location}</Text>
              </View>
            </ImageBackground>
            <View style={styles.cardBody}>
              <Text style={styles.cardSummary}>{item.summary}</Text>
              <Text style={styles.cardMeta}>Swipe to discover more stories</Text>
            </View>
          </View>
        </View>
      );
    },
    [activeCardsLength, cardWidth, styles, theme.spacing.lg]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View style={styles.heroSurface}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroKicker}>Today&#39;s Moment</Text>
            <Text style={styles.heroTitle}>Daily Historic</Text>
            <Text style={styles.heroLead}>{createHeroCopy(profile?.displayName)}</Text>
          </View>

          <Animated.View style={[styles.heroMomentCard, heroAnimatedStyle]}>
            <View style={styles.heroArtwork}>
              <Image
                pointerEvents="none"
                source={heroBackdropGradient}
                style={styles.heroArtworkBackground}
                contentFit="cover"
              />
              <Image
                source={HERO_MOMENT.image}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
              />
              <Image
                pointerEvents="none"
                source={heroOverlayGradient}
                style={styles.heroArtworkOverlay}
                contentFit="cover"
              />
            </View>
            <View style={styles.heroMomentContent}>
              <Text style={styles.heroMomentBadge}>{HERO_MOMENT.badge}</Text>
              <Text style={styles.heroMomentTitle}>{HERO_MOMENT.title}</Text>
              <Text style={styles.heroMomentSummary}>{HERO_MOMENT.summary}</Text>
              <Text style={styles.heroMomentMeta}>{HERO_MOMENT.meta}</Text>

              <View style={styles.heroActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    triggerLightHaptic();
                    noop();
                  }}
                  style={({ pressed }) => [
                    styles.primaryAction,
                    pressed && styles.primaryActionPressed,
                  ]}
                >
                  <Text style={styles.primaryActionLabel}>Continue</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    triggerLightHaptic();
                    noop();
                  }}
                  style={({ pressed }) => [
                    styles.ghostAction,
                    pressed && styles.ghostActionPressed,
                  ]}
                >
                  <Text style={styles.ghostActionLabel}>Preview</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          <View style={styles.heroControls}>
            <View style={styles.controlsRow}>
              {TIMELINE_OPTIONS.map((option) => {
                const isActive = option.id === activeFilter;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => handleFilterPress(option.id)}
                    style={({ pressed }) => [
                      styles.timelineChip,
                      isActive && styles.timelineChipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timelineChipText,
                        isActive && styles.timelineChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={signOut}
              accessibilityRole="button"
              style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.surfaceSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spotlight Chronicle</Text>
            <Text style={styles.sectionSubtitle}>Swipe to explore</Text>
          </View>

          <FlatList
            data={activeCards}
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            keyExtractor={keyExtractor}
            renderItem={renderCard}
            contentContainerStyle={{
              paddingHorizontal: (width - cardWidth) / 2,
              paddingVertical: theme.spacing.sm,
            }}
            snapToAlignment="center"
            snapToInterval={cardWidth + theme.spacing.lg}
            decelerationRate="fast"
            onViewableItemsChanged={handleViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig}
          />

          <View style={styles.pagerDots}>
            {activeCards.map((card, index) => {
              const isActive = index === activeCardIndex;
              return (
                <View
                  key={card.id}
                  style={[styles.pagerDot, isActive && styles.pagerDotActive]}
                  accessibilityLabel={`${card.year} - ${card.title}`}
                  accessibilityState={{ selected: isActive }}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.quickSection}>
          <View style={styles.quickCard}>
            <Text style={styles.quickTitle}>Keep exploring</Text>
            <Text style={styles.quickCopy}>
              Scan the archive for the eras you love, expand your personal timeline, and unlock a new story every day.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
