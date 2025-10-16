import React, { useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getEventById, heroEvent, type EventRecord } from '@/constants/events';
import { useEventEngagement } from '@/hooks/use-event-engagement';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import { createLinearGradientSource } from '@/utils/gradient';

const reactions = [
  { id: 'appreciate' as const, emoji: '👍', label: 'Appreciate' },
  { id: 'insight' as const, emoji: '💡', label: 'Insight' },
];

const shareEvent = async (event: EventRecord) => {
  try {
    await Share.share({ title: event.title, message: `${event.title} — ${event.summary}` });
  } catch (error) {
    console.error('Share failed', error);
  }
};

const createStyles = (theme: ThemeDefinition) => {
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
      gap: spacing.xl,
    },
    heroHeader: {
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.heroBackground,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.2,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 18 },
      elevation: 10,
    },
    heroMedia: {
      height: 340,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    heroBody: {
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accentPrimary,
      color: colors.accentPrimary,
      fontFamily: sansFamily,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontFamily: serifFamily,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.4,
      color: colors.textPrimary,
    },
    heroSummary: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    heroMeta: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textTertiary,
    },
    contentSection: {
      paddingHorizontal: spacing.xl,
      gap: spacing.lg,
    },
    paragraph: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      lineHeight: 24,
      color: colors.textPrimary,
    },
    secondaryCopy: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    callout: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      gap: spacing.xs,
    },
    calloutLabel: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      color: colors.textPrimary,
    },
    calloutBody: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    engagementRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    reactionGroup: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    reactionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    reactionActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    reactionLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    reactionLabelActive: {
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    actionLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    sourceList: {
      gap: spacing.xs,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sourceLink: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textPrimary,
      textDecorationLine: 'underline',
    },
    navBar: {
      position: 'absolute',
      top: spacing.lg,
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(12, 10, 6, 0.45)',
    },
    navLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: '#fff',
    },
    missingSurface: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xl,
      backgroundColor: colors.screen,
    },
  });
};

const EventDetailScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const event = params.id ? getEventById(params.id) : heroEvent;

  const fallback = !event;
  const engagement = useEventEngagement(event?.id ?? '');
  const heroOverlay = useMemo(
    () =>
      createLinearGradientSource(
        [
          { offset: 0, color: 'rgba(12, 10, 6, 0.1)' },
          { offset: 100, color: 'rgba(12, 10, 6, 0.6)' },
        ],
        { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
      ),
    []
  );

  if (fallback || !event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.missingSurface}>
          <Text style={styles.heroTitle}>We could not find that moment.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.actionLabel}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { isSaved, reaction, toggleReaction, toggleSave } = engagement;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroHeader}>
            <View style={styles.heroMedia}>
              <Image source={event.image} style={styles.heroImage} contentFit="cover" transition={200} />
              <Image
                pointerEvents="none"
                source={heroOverlay}
                style={styles.heroOverlay}
                contentFit="cover"
              />
              <View style={styles.navBar}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.back()}
                  style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.85 }]}
                >
                  <IconSymbol name="chevron.right" size={18} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
                  <Text style={styles.navLabel}>Back</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => shareEvent(event)}
                  style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.85 }]}
                >
                  <IconSymbol name="square.and.arrow.up" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroBadge}>{event.year}</Text>
              <Text style={styles.heroTitle}>{event.title}</Text>
              <Text style={styles.heroSummary}>{event.summary}</Text>
              <Text style={styles.heroMeta}>{event.location}</Text>

              <View style={styles.engagementRow}>
                <View style={styles.reactionGroup}>
                  {reactions.map((item) => {
                    const active = reaction === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => toggleReaction(item.id)}
                        style={({ pressed }) => [
                          styles.reactionChip,
                          active && styles.reactionActive,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text>{item.emoji}</Text>
                        <Text style={[styles.reactionLabel, active && styles.reactionLabelActive]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.reactionGroup}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSaved }}
                    onPress={toggleSave}
                    style={({ pressed }) => [
                      styles.actionButton,
                      isSaved && styles.reactionActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <IconSymbol
                      name={isSaved ? 'bookmark.fill' : 'bookmark'}
                      size={20}
                      color={isSaved ? theme.colors.accentPrimary : theme.colors.textSecondary}
                    />
                    <Text style={[styles.actionLabel, isSaved && styles.reactionLabelActive]}>
                      {isSaved ? 'Saved' : 'Save'}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => shareEvent(event)}
                    style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
                  >
                    <IconSymbol name="square.and.arrow.up" size={20} color={theme.colors.textSecondary} />
                    <Text style={styles.actionLabel}>Share</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.paragraph}>{event.detail}</Text>

            {event.whyItMatters ? (
              <View style={styles.callout}>
                <Text style={styles.calloutLabel}>Why you’re seeing this</Text>
                <Text style={styles.calloutBody}>{event.whyItMatters}</Text>
              </View>
            ) : null}

            <Text style={styles.secondaryCopy}>Sources</Text>
            <View style={styles.sourceList}>
              {event.sources.map((source) => (
                <View key={source.url} style={styles.sourceRow}>
                  <IconSymbol name="chevron.right" size={16} color={theme.colors.textSecondary} />
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => {
                      void Linking.openURL(source.url);
                    }}
                  >
                    <Text style={styles.sourceLink}>{source.label}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default EventDetailScreen;
