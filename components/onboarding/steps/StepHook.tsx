import { useMemo } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useOnboardingContext } from '@/contexts/onboarding-context';
import { useAppTheme, type ThemeDefinition } from '@/theme';

import { createOnboardingStyles } from '../styles';
import type { StepComponentProps } from '../types';

const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const sansFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

const createStyles = (theme: ThemeDefinition) => {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    textSection: {
      paddingHorizontal: 0,
      paddingTop: spacing.xs,
      gap: spacing.md,
      alignItems: 'flex-start',
      width: '100%',
    },
    headline: {
      fontFamily: serifFamily,
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.6,
      color: colors.textPrimary,
      fontWeight: '400',
      textAlign: 'left',
    },
    body: {
      fontFamily: sansFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'left',
    },
    imageSection: {
      width: '100%',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingVertical: spacing.sm,
    },
    mascot: {
      width: '84%',
      maxWidth: 320,
      height: '100%',
      maxHeight: 390,
    },
    actions: {
      width: '100%',
      gap: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
  });
};

const StepHook = ({ onNext }: StepComponentProps) => {
  const { updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { styles: shared } = useMemo(() => createOnboardingStyles(theme), [theme]);

  const handleBegin = () => {
    updateState({ heroPreviewSeen: true });
    onNext();
  };

  return (
    <View style={styles.container}>
      <View style={styles.textSection}>
        <Text style={styles.headline}>
          What if you could relive the moments that shaped the world?
        </Text>
        <Text style={styles.body}>
          One curated story from history, every single day. Personalised for your curiosity.
        </Text>
      </View>

      <View style={styles.imageSection}>
        <Image
          source={require('../../../assets/mascot/pointy.png')}
          style={styles.mascot}
          resizeMode="contain"
          accessible={false}
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleBegin}
          accessibilityRole="button"
          accessibilityLabel="Show me"
          style={({ pressed }) => [
            shared.primaryButton,
            { flex: 0, width: '100%' },
            pressed && shared.primaryButtonPressed,
          ]}
        >
          <Text style={shared.primaryButtonText}>Let&apos;s go</Text>
        </Pressable>
        <Text style={[shared.legalText, { textAlign: 'center' }]}>
          Free to start. No account required.
        </Text>
      </View>
    </View>
  );
};

export default StepHook;
