import React, { useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { CATEGORY_LABELS, ERA_LABELS } from '@/constants/personalization';
import type { CategoryOption, EraOption } from '@/contexts/onboarding-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';

export type FilterState = {
  categories: Set<CategoryOption>;
  era: EraOption | null;
};

type FilterModalProps = {
  visible: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
};

const CATEGORIES: Array<{ id: CategoryOption; label: string }> = Object.entries(CATEGORY_LABELS).map(
  ([id, label]) => ({ id: id as CategoryOption, label })
);

const ERAS: Array<{ id: EraOption; label: string }> = Object.entries(ERA_LABELS).map(([id, label]) => ({
  id: id as EraOption,
  label,
}));

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing, radius, typography } = theme;
  const serifFamily = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });
  const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(12, 10, 6, 0.4)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      maxHeight: '80%',
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.24,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: -8 },
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    headerTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingLg.fontSize,
      lineHeight: typography.headingLg.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    closeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.xl,
    },
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      minWidth: '31%', // 3 columns with gaps
      minHeight: 44, // Accessibility: ensure touch target ≥44pt
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryChipActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    chipLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    chipLabelActive: {
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    eraList: {
      gap: spacing.xs,
    },
    eraRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.card,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      minHeight: 56,
    },
    eraRowActive: {
      borderColor: colors.accentPrimary,
      backgroundColor: colors.accentSoft,
    },
    eraLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
    },
    eraLabelActive: {
      color: colors.accentPrimary,
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    resetButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    applyButton: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.accentPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    buttonLabel: {
      fontFamily: sansFamily,
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    applyButtonLabel: {
      color: colors.surface,
    },
  });
};

export const FilterModal = ({
  visible,
  filters,
  onFiltersChange,
  onReset,
  onApply,
  onClose,
}: FilterModalProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleCategoryToggle = (categoryId: CategoryOption) => {
    const newCategories = new Set(filters.categories);
    if (newCategories.has(categoryId)) {
      newCategories.delete(categoryId);
    } else {
      newCategories.add(categoryId);
    }
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleEraSelect = (eraId: EraOption) => {
    const newEra = filters.era === eraId ? null : eraId;
    onFiltersChange({ ...filters, era: newEra });
  };

  const handleReset = () => {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onReset();
  };

  const handleApply = () => {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onApply();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
          >
            <IconSymbol name="xmark" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Categories</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => {
                const isActive = filters.categories.has(category.id);
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${category.label} category`}
                    onPress={() => handleCategoryToggle(category.id)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      isActive && styles.categoryChipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Era Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Era</Text>
            <View style={styles.eraList}>
              {ERAS.map((era) => {
                const isActive = filters.era === era.id;
                return (
                  <Pressable
                    key={era.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${era.label} era`}
                    onPress={() => handleEraSelect(era.id)}
                    style={({ pressed }) => [
                      styles.eraRow,
                      isActive && styles.eraRowActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[styles.eraLabel, isActive && styles.eraLabelActive]}>
                      {era.label}
                    </Text>
                    {isActive && (
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={20}
                        color={theme.colors.accentPrimary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset all filters"
            onPress={handleReset}
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.buttonLabel}>Reset</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Apply filters"
            onPress={handleApply}
            style={({ pressed }) => [styles.applyButton, pressed && { opacity: 0.9 }]}
          >
            <Text style={[styles.buttonLabel, styles.applyButtonLabel]}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
