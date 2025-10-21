import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';

const CollectionDetailPlaceholder = () => {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.appBackground,
        },
        container: {
          flex: 1,
          backgroundColor: theme.colors.screen,
        },
        content: {
          padding: theme.spacing.xl,
          gap: theme.spacing.lg,
        },
        title: {
          fontFamily: 'Times New Roman',
          fontSize: 28,
          color: theme.colors.textPrimary,
        },
        helper: {
          fontFamily: 'System',
          fontSize: 16,
          color: theme.colors.textSecondary,
        },
        note: {
          fontFamily: 'System',
          fontSize: 14,
          color: theme.colors.textSecondary,
        },
      }),
    [theme]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{params.id ?? 'Collection'}</Text>
          <Text style={styles.helper}>We are preparing this collection experience.</Text>
          <Text style={styles.note}>
            You reached a placeholder screen. Navigation flows will connect to the detailed collection story soon.
          </Text>
          <Text style={styles.note} onPress={() => router.back()}>
            ← Go back
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CollectionDetailPlaceholder;

