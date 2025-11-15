import React, { useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useUserContext } from '@/contexts/user-context';
import { SelectableChip } from '@/components/ui/selectable-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme, type ThemeDefinition } from '@/theme';
import type { CategoryOption, EraOption } from '@/contexts/onboarding-context';
import { ThemeToggle } from '@/components/profile/ThemeToggle';

const CATEGORY_CHOICES: { value: CategoryOption; label: string }[] = [
  { value: 'world-wars', label: 'World Wars' },
  { value: 'ancient-civilizations', label: 'Ancient Worlds' },
  { value: 'science-discovery', label: 'Science & Discovery' },
  { value: 'art-culture', label: 'Art & Culture' },
  { value: 'politics', label: 'Leaders & Power' },
  { value: 'inventions', label: 'Breakthroughs' },
  { value: 'natural-disasters', label: 'Forces of Nature' },
  { value: 'civil-rights', label: 'Rights & Movements' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'surprise', label: 'Surprise me' },
];

const ERA_CHOICES: { value: EraOption; label: string }[] = [
  { value: 'prehistory', label: 'Prehistory' },
  { value: 'ancient', label: 'Ancient Worlds' },
  { value: 'medieval', label: 'Medieval' },
  { value: 'early-modern', label: 'Early Modern' },
  { value: 'nineteenth', label: '19th Century' },
  { value: 'twentieth', label: '20th Century' },
  { value: 'contemporary', label: 'Contemporary' },
];

const REMINDER_OPTIONS = ['09:00', '12:00', '17:00'];

const accountLabels: Record<string, string> = {
  apple: 'Sign in with Apple',
  google: 'Sign in with Google',
  email: 'Email & password',
  anonymous: 'Guest session',
  meta: 'Sign in with Meta',
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
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
      gap: spacing.xxl,
    },
    header: {
      gap: spacing.xs,
    },
    greeting: {
      fontFamily: serifFamily,
      fontSize: typography.headingLg.fontSize,
      lineHeight: typography.headingLg.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    helper: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    section: {
      gap: spacing.lg,
    },
    sectionTitle: {
      fontFamily: serifFamily,
      fontSize: typography.headingMd.fontSize,
      lineHeight: typography.headingMd.lineHeight,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionBody: {
      gap: spacing.md,
    },
    chipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    preferenceBlock: {
      gap: spacing.sm,
    },
    preferenceLabel: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      color: colors.textPrimary,
    },
    preferenceMeta: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
    },
    inlineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchLabel: {
      fontFamily: sansFamily,
      fontSize: typography.label.fontSize,
      color: colors.textPrimary,
    },
    accountCard: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    accountLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
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
      color: colors.textPrimary,
    },
    signOutButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: 'transparent',
    },
    signOutLabel: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    linkText: {
      fontFamily: sansFamily,
      fontSize: typography.helper.fontSize,
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
  });
};

const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

const ProfileScreen = () => {
  const { profile, updateProfile, signOut } = useUserContext();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const handleToggleCategory = (value: CategoryOption) => {
    if (!profile) {
      return;
    }
    const current = profile.categories ?? [];
    if (value === 'surprise') {
      void updateProfile({ categories: ['surprise'], categoriesSkipped: false });
      return;
    }

    const withoutSurprise = current.filter((item) => item !== 'surprise');
    const next = withoutSurprise.includes(value)
      ? withoutSurprise.filter((item) => item !== value)
      : [...withoutSurprise, value];

    void updateProfile({
      categories: next,
      categoriesSkipped: next.length === 0,
    });
  };

  const handleToggleEra = (value: EraOption) => {
    if (!profile) {
      return;
    }
    const current = profile.eras ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    void updateProfile({ eras: next });
  };

  const handleReminderChange = (time: string) => {
    void updateProfile({ notificationTime: time });
  };

  const handleUseDeviceTimezone = () => {
    const timezone = detectTimezone();
    void updateProfile({ timezone });
  };

  const accountLabel = accountLabels[profile?.accountSelection ?? 'anonymous'];
  const timezoneLabel = profile?.timezone ?? detectTimezone();
  const reminderTime = profile?.notificationTime ?? '09:00';
  const digestEnabled = profile?.notificationEnabled ?? true;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>
              {profile?.displayName ? `Hi, ${profile.displayName}` : 'Your profile'}
            </Text>
            <Text style={styles.helper}>Tune your preferences and account settings.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.sectionBody}>
              <View style={styles.preferenceBlock}>
                <ThemeToggle
                  value={profile?.themePreference ?? 'system'}
                  onChange={(preference) => void updateProfile({ themePreference: preference })}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.sectionBody}>
              <View style={styles.preferenceBlock}>
                <View style={styles.inlineRow}>
                  <Text style={styles.switchLabel}>Daily email digest</Text>
                  <Switch
                    accessibilityLabel="Toggle daily email digest"
                    value={digestEnabled}
                    onValueChange={(next) => void updateProfile({ notificationEnabled: next })}
                    trackColor={{ false: theme.colors.borderSubtle, true: theme.colors.accentSoft }}
                    thumbColor={digestEnabled ? theme.colors.accentPrimary : theme.colors.surface}
                  />
                </View>
                <Text style={styles.preferenceMeta}>
                  Matches your notification permission; turn off to pause daily emails.
                </Text>
              </View>

              <View style={styles.preferenceBlock}>
                <Text style={styles.preferenceLabel}>Reminder time</Text>
                <View style={styles.chipGroup}>
                  {REMINDER_OPTIONS.map((time) => {
                    const selected = reminderTime === time;
                    return (
                      <SelectableChip
                        key={time}
                        label={time}
                        selected={selected}
                        onPress={() => handleReminderChange(time)}
                      />
                    );
                  })}
                </View>
                <Text style={styles.preferenceMeta}>
                  Current: {reminderTime}. Adjusting updates tomorrow's email.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content Preferences</Text>
            <View style={styles.sectionBody}>
              <View style={styles.preferenceBlock}>
                <Text style={styles.preferenceLabel}>Themes</Text>
                <View style={styles.chipGroup}>
                  {CATEGORY_CHOICES.map((option) => {
                    const selected = profile?.categories?.includes(option.value) ?? false;
                    return (
                      <SelectableChip
                        key={option.value}
                        label={option.label}
                        selected={selected}
                        onPress={() => handleToggleCategory(option.value)}
                      />
                    );
                  })}
                </View>
              </View>

              <View style={styles.preferenceBlock}>
                <Text style={styles.preferenceLabel}>Eras</Text>
                <View style={styles.chipGroup}>
                  {ERA_CHOICES.map((option) => {
                    const selected = profile?.eras?.includes(option.value) ?? false;
                    return (
                      <SelectableChip
                        key={option.value}
                        label={option.label}
                        selected={selected}
                        onPress={() => handleToggleEra(option.value)}
                      />
                    );
                  })}
                </View>
              </View>

              <View style={styles.preferenceBlock}>
                <View style={styles.inlineRow}>
                  <View>
                    <Text style={styles.preferenceLabel}>Time zone</Text>
                    <Text style={styles.preferenceMeta}>{timezoneLabel}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleUseDeviceTimezone}
                    style={({ pressed }) => [styles.ghostButton, pressed && { opacity: 0.85 }]}
                  >
                    <IconSymbol name="location" size={18} color={theme.colors.textPrimary} />
                    <Text style={styles.ghostLabel}>Use device</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.accountCard}>
              <Text style={styles.accountLabel}>{accountLabel}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL('https://chrono.example.com/privacy')}
                style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.85 }]}
              >
                <IconSymbol name="chevron.right" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.linkText}>Privacy & data</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL('https://chrono.example.com/terms')}
                style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.85 }]}
              >
                <IconSymbol name="chevron.right" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.linkText}>Terms of use</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void signOut()}
                style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.signOutLabel}>Sign out</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development</Text>
            <View style={styles.sectionBody}>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  await updateProfile({ onboardingCompleted: false });
                  router.replace('/onboarding');
                }}
                style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.signOutLabel}>Reset Onboarding (Dev)</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
