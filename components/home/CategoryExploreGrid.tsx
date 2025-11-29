import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';

import type { CategoryOption } from '@/contexts/onboarding-context';
import { formatCategoryLabel } from '@/constants/personalization';
import { useAppTheme, type ThemeDefinition } from '@/theme';

type CategoryItem = {
  id: CategoryOption;
  icon?: ImageSource;
  emoji: string;
};

// Icon mapping based on assets/icons/
const CATEGORY_ICONS: Partial<Record<CategoryOption, ImageSource>> = {
  'art-culture': require('@/assets/icons/Art-Culture.png'),
  'science-discovery': require('@/assets/icons/Science-Discovery.png'),
  'politics': require('@/assets/icons/Politics.png'),
  'ancient-civilizations': require('@/assets/icons/Ancient-Civilizations.png'),
  'exploration': require('@/assets/icons/Explorations.png'),
};

const FEATURED_CATEGORIES: CategoryItem[] = [
  { id: 'art-culture', icon: CATEGORY_ICONS['art-culture'], emoji: '🎨' },
  { id: 'world-wars', emoji: '⚔️' }, // No icon available, use emoji
  { id: 'science-discovery', icon: CATEGORY_ICONS['science-discovery'], emoji: '🔬' },
  { id: 'politics', icon: CATEGORY_ICONS['politics'], emoji: '💼' },
  { id: 'ancient-civilizations', icon: CATEGORY_ICONS['ancient-civilizations'], emoji: '🏛️' },
  { id: 'exploration', icon: CATEGORY_ICONS['exploration'], emoji: '🗺️' },
];

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    container: {
      gap: spacing.md,
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
    scrollContainer: {
      paddingVertical: spacing.xs,
    },
    gridWrapper: {
      flexDirection: 'column',
      gap: spacing.sm,
    },
    gridRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      minWidth: 160,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    categoryIcon: {
      width: 32,
      height: 32,
    },
    categoryEmoji: {
      fontSize: 24,
    },
    categoryLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      color: colors.textPrimary,
      fontWeight: '500',
    },
  });
};

type CategoryExploreGridProps = {
  testID?: string;
};

export const CategoryExploreGrid: React.FC<CategoryExploreGridProps> = ({ testID }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const handleCategoryPress = (categoryId: CategoryOption) => {
    // Navigate to Explore with category filter
    router.push({
      pathname: '/explore',
      params: { category: categoryId },
    });
  };

  // Split categories into 2 rows of 3
  const firstRow = FEATURED_CATEGORIES.slice(0, 3);
  const secondRow = FEATURED_CATEGORIES.slice(3, 6);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Explore by Category</Text>
        <Text style={styles.sectionHelper}>Jump into topics that interest you.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.gridWrapper}>
          <View style={styles.gridRow}>
            {firstRow.map((category) => (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={`Explore ${formatCategoryLabel(category.id)}`}
                onPress={() => handleCategoryPress(category.id)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {category.icon ? (
                  <Image
                    source={category.icon}
                    style={styles.categoryIcon}
                    contentFit="contain"
                  />
                ) : (
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                )}
                <Text style={styles.categoryLabel}>
                  {formatCategoryLabel(category.id)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.gridRow}>
            {secondRow.map((category) => (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={`Explore ${formatCategoryLabel(category.id)}`}
                onPress={() => handleCategoryPress(category.id)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {category.icon ? (
                  <Image
                    source={category.icon}
                    style={styles.categoryIcon}
                    contentFit="contain"
                  />
                ) : (
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                )}
                <Text style={styles.categoryLabel}>
                  {formatCategoryLabel(category.id)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
