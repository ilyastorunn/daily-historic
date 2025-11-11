import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { useEventEngagement } from '@/hooks/use-event-engagement';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { FirestoreEventDocument } from '@/types/events';
import { heroEvent } from '@/constants/events';
import {
  getEventImageUri,
  getEventTitle,
  getEventYearLabel,
} from '@/utils/event-presentation';

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      gap: spacing.lg,
    },
    sectionHeader: {
      gap: spacing.xs,
    },
    sectionTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionHelper: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    savedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    savedImage: {
      width: 72,
      height: 72,
      borderRadius: 14,
    },
    savedCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    savedYear: {
      fontFamily: sansFamily,
      fontSize: 12,
      letterSpacing: 0.5,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    savedTitle: {
      fontFamily: serifFamily,
      fontSize: 18,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    savedActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    ghostButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    ghostLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    emptyCopy: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
  });
};

const shareEvent = async (event: FirestoreEventDocument) => {
  try {
    const title = getEventTitle(event);
    await Share.share({
      title,
      message: title,
    });
  } catch (error) {
    console.error('Share failed', error);
  }
};

type SavedEventCardProps = {
  event: FirestoreEventDocument;
  styles: ReturnType<typeof createStyles>;
  onOpen: () => void;
};

const SavedEventCard: React.FC<SavedEventCardProps> = ({ event, styles, onOpen }) => {
  const theme = useAppTheme();
  const { toggleSave } = useEventEngagement(event.eventId);

  const imageUri = getEventImageUri(event);
  const imageSource = imageUri ? { uri: imageUri } : heroEvent.image;
  const yearLabel = getEventYearLabel(event);
  const title = getEventTitle(event);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.savedCard, pressed && { opacity: 0.9 }]}
    >
      <Image source={imageSource} style={styles.savedImage} contentFit="cover" transition={150} />
      <View style={styles.savedCopy}>
        <Text style={styles.savedYear}>{yearLabel}</Text>
        <Text style={styles.savedTitle}>{title}</Text>

        <View style={styles.savedActions}>
          <Pressable
            accessibilityRole="button"
            onPress={(pressEvent) => {
              pressEvent.stopPropagation();
              shareEvent(event);
            }}
            style={({ pressed }) => [styles.ghostButton, pressed && { opacity: 0.85 }]}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.ghostLabel}>Share</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={(pressEvent) => {
              pressEvent.stopPropagation();
              toggleSave();
            }}
            style={({ pressed }) => [styles.ghostButton, pressed && { opacity: 0.85 }]}
          >
            <IconSymbol name="bookmark.fill" size={18} color={theme.colors.accentPrimary} />
            <Text style={[styles.ghostLabel, { color: theme.colors.accentPrimary }]}>Saved</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

type SavedStoriesProps = {
  savedEvents: any[]; // Can be EventRecord or FirestoreEventDocument
  loading?: boolean;
  onEventPress: (eventId: string) => void;
};

export const SavedStories: React.FC<SavedStoriesProps> = ({ savedEvents, loading, onEventPress }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return null; // Could add a loading skeleton here
  }

  if (savedEvents.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Saved Stories</Text>
        <Text style={styles.sectionHelper}>Quick access to stories you've bookmarked.</Text>
      </View>

      {savedEvents.map((event) => (
        <SavedEventCard
          key={event.eventId}
          event={event}
          styles={styles}
          onOpen={() => onEventPress(event.eventId)}
        />
      ))}
    </View>
  );
};
