import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useOnboardingContext } from '@/contexts/onboarding-context';

import HeroCollage from '../HeroCollage';
import type { StepComponentProps } from '../types';
import { styles } from '../styles';

const StepWelcome = ({ onNext }: StepComponentProps) => {
  const { updateState } = useOnboardingContext();
  const router = useRouter();

  const handleBegin = () => {
    updateState({ heroPreviewSeen: true });
    onNext();
  };

  const handlePreview = () => {
    updateState({ heroPreviewSeen: true });
  };

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScrollView contentContainerStyle={styles.welcomeScroll}>
      <View style={styles.heroMasthead}>
        <HeroCollage />
        <Text style={styles.heroGreeting}>Welcome, Time Voyager!</Text>
        <Text style={styles.heroBody}>
          Chrono curates one luminous moment from history every day. Let’s tune the timeline so it fits your curiosity.
        </Text>
      </View>

      <View style={styles.heroActions}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={handleBegin}
        >
          <Text style={styles.primaryButtonText}>Start Your Journey</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
          onPress={handlePreview}
        >
          <Text style={styles.secondaryButtonText}>Preview Today’s Highlight</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleLogin}>
        <Text style={styles.ghostLink}>Already have a pass? Sign in</Text>
      </Pressable>

      <Text style={styles.heroFootnote}>
        Curated stories, gentle reminders, nothing spammy. You can tweak everything later in settings.
      </Text>
    </ScrollView>
  );
};

export default StepWelcome;
