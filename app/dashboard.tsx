import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserContext } from '@/contexts/user-context';
import { useAppTheme } from '@/theme';
import type { ThemeDefinition } from '@/theme/tokens';

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
  { id: 'today', label: 'Bugünün Hikâyeleri' },
  { id: 'for-you', label: 'Senin İçin' },
  { id: 'archives', label: 'Arşiv Hazineleri' },
];

const createHeroCopy = (displayName?: string) => {
  if (!displayName) {
    return 'Bugünün manşetleri seni bekliyor.';
  }
  return `${displayName}, bugünün manşetleri seni bekliyor.`;
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
      paddingBottom: spacing.xxl,
      gap: spacing.xxl,
    },
    heroSurface: {
      backgroundColor: colors.heroBackground,
      borderBottomLeftRadius: radius.xl,
      borderBottomRightRadius: radius.xl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    heroHeader: {
      gap: spacing.sm,
    },
    brandMark: {
      color: colors.textInverse,
      fontFamily: serifFamily,
      fontSize: typography.headingLg.fontSize,
      lineHeight: typography.headingLg.lineHeight,
      letterSpacing: -0.3,
    },
    subheading: {
      color: colors.accentMuted,
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    heroCopy: {
      color: colors.textInverse,
      fontFamily: serifFamily,
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.4,
    },
    heroBody: {
      color: colors.accentMuted,
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    controlsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    timelineChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    timelineChipActive: {
      backgroundColor: colors.accentPrimary,
      borderColor: colors.accentPrimary,
    },
    timelineChipText: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      color: colors.textInverse,
    },
    timelineChipTextActive: {
      color: colors.surface,
    },
    signOutButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.heroBackground,
    },
    signOutText: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      color: colors.textInverse,
    },
    surfaceSection: {
      marginTop: -spacing.xxl,
      paddingHorizontal: spacing.xl,
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
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
      width: '100%',
    },
    cardImage: {
      height: 220,
      justifyContent: 'flex-end',
    },
    cardImageOverlay: {
      backgroundColor: withOpacity(colors.appBackground, 0.58),
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    cardYearBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    cardYearText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      lineHeight: typography.helper.lineHeight,
      color: colors.accentPrimary,
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
      paddingHorizontal: spacing.xl,
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
      title: 'Ay’a İlk Adım',
      summary:
        'Neil Armstrong ve Buzz Aldrin Ay yüzeyine adım atarak insanlığın uzay keşfinde yeni bir çağ açıyor.',
      location: 'Denizler Durağı, Ay',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Aldrin_Apollo_11_original.jpg/640px-Aldrin_Apollo_11_original.jpg',
    },
    {
      id: 'printing-press',
      year: '1455',
      title: 'Gutenberg’in Devrimi',
      summary:
        'Johannes Gutenberg’in Baskı İncili kitap üretimini hızlandırarak fikirlerin kıtalar arasında yayılmasını sağlıyor.',
      location: 'Mainz, Kutsal Roma İmparatorluğu',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg/640px-Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg',
    },
    {
      id: 'rosa-parks',
      year: '1955',
      title: 'Rosa Parks’ın Direnişi',
      summary:
        'Rosa Parks’ın koltuğunu bırakmayı reddetmesi, sivil haklar hareketini hızlandıran Montgomery Otobüs Boykotunu tetikliyor.',
      location: 'Montgomery, Alabama',
      imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Rosaparks_bus.jpg/640px-Rosaparks_bus.jpg',
    },
  ],
  'for-you': [
    {
      id: 'curie-nobel',
      year: '1903',
      title: 'Curie’lerin Nobel Zaferi',
      summary:
        'Marie ve Pierre Curie’nin radyoaktivite üzerine çalışmaları, bilim dünyasında kadınların görünürlüğünü artıran Nobel ödülüyle taçlanıyor.',
      location: 'Stockholm, İsveç',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Marie_Curie_c1920.jpg/640px-Marie_Curie_c1920.jpg',
    },
    {
      id: 'istanbul-convention',
      year: '1936',
      title: 'Montreux Boğazlar Sözleşmesi',
      summary:
        'Türkiye’nin boğazlar üzerindeki egemenliğini güçlendiren Montreux düzenlemesi, Karadeniz dengesini yeniden tanımlıyor.',
      location: 'Montreux, İsviçre',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Montreux_Palace.jpg/640px-Montreux_Palace.jpg',
    },
    {
      id: 'voyager-golden',
      year: '1977',
      title: 'Voyager Altın Plak',
      summary:
        'Dünya’nın sesleri Voyager sondalarına kazınarak yıldızlararası yolculuğa çıkıyor; geleceğin dinleyicilerine kozmik bir mesaj bırakılıyor.',
      location: 'Cape Canaveral, ABD',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Voyager_Golden_Record.jpg/640px-Voyager_Golden_Record.jpg',
    },
  ],
  archives: [
    {
      id: 'magna-carta',
      year: '1215',
      title: 'Magna Carta İmzası',
      summary:
        'İngiliz baronları, kralın yetkilerini sınırlayan Magna Carta’yı kabul ettirerek modern hukukun yapı taşını atıyor.',
      location: 'Runnymede, İngiltere',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Magna_Carta_%28British_Library_Cotton_MS_Augustus_II.106%29.jpg/640px-Magna_Carta_%28British_Library_Cotton_MS_Augustus_II.106%29.jpg',
    },
    {
      id: 'hagia-sophia',
      year: '537',
      title: 'Ayasofya’nın Kubbesi',
      summary:
        'İmparator Justinianus, Ayasofya’nın açılışında “Süleyman seni geçtim” diyerek Bizans mimarisinin doruk noktasını ilan ediyor.',
      location: 'Konstantinopolis',
      imageUri:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Hagia_Sophia_Mars_2013.jpg/640px-Hagia_Sophia_Mars_2013.jpg',
    },
    {
      id: 'catalhoyuk',
      year: 'MÖ 7400',
      title: 'Çatalhöyük’te Yaşam',
      summary:
        'Anadolu’nun erken yerleşimlerinden Çatalhöyük’te ortaya çıkan freskler, topluluk yaşamının ritüellerini günümüze taşıyor.',
      location: 'Konya Ovası, Anadolu',
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

  const activeCards = useMemo(() => EVENT_LIBRARY[activeFilter], [activeFilter]);
  const activeCardsLength = activeCards.length;

  const cardWidth = useMemo(() => {
    const horizontalPadding = theme.spacing.xl * 2;
    const maxWidth = 360;
    return Math.min(width - horizontalPadding, maxWidth);
  }, [width, theme.spacing.xl]);

  const handleFilterPress = useCallback((option: TimelineFilter) => {
    setActiveFilter(option);
  }, []);

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
              <Text style={styles.cardMeta}>Kaydırarak diğer hikâyeleri keşfet</Text>
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
      >
        <View style={styles.heroSurface}>
                <View style={styles.heroHeader}>
                  <Text style={styles.subheading}>Günün seçkisi</Text>
                  <Text style={styles.brandMark}>Daily Historic</Text>
                  <Text style={styles.heroCopy}>{createHeroCopy(profile?.displayName)}</Text>
                  <Text style={styles.heroBody}>
                    Tarih boyunca yankılanan keşifleri, devrimleri ve direnişleri tek akışta buluşturuyoruz.
                  </Text>
                </View>

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
                  style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.signOutText}>Oturumu kapat</Text>
                </Pressable>
        </View>

        <View style={styles.surfaceSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Spotlight Güncesi</Text>
                  <Text style={styles.sectionSubtitle}>Kaydırarak keşfet</Text>
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
            <Text style={styles.quickTitle}>Keşfetmeye Devam Et</Text>
            <Text style={styles.quickCopy}>
              İlgilendiğin dönemler için arşive göz at, kişisel zaman çizelgeni genişlet ve her gün yeni bir hikâyeyi
              kilidinden çıkar.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
