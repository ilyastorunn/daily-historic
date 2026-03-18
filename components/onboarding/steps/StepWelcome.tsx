import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useOnboardingContext } from "@/contexts/onboarding-context";
import { useAppTheme } from "@/theme";

import DecorativeIllustration from "../DecorativeIllustration";
import { createOnboardingStyles, spacingScale } from "../styles";
import type { StepComponentProps } from "../types";

const einsteinIllustration = require("@/assets/illustrations/einstein.png");
const atomIllustration = require("@/assets/illustrations/atom.png");

const ATOM_SIZE = 210;

const StepWelcome = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const router = useRouter();
  const theme = useAppTheme();
  const { styles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const { height: windowHeight } = useWindowDimensions();
  const displayName = state.displayName.trim();
  const greeting = displayName ? `Hello, ${displayName}!` : "Hello!";

  // Responsive Einstein size: 38% of screen height, capped between 200–300pt
  const einsteinSize = Math.min(
    Math.max(Math.round(windowHeight * 0.38), 200),
    300,
  );

  const handleBegin = () => {
    updateState({ heroPreviewSeen: true });
    onNext();
  };

  const handleLogin = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={localStyles.container}>
      {/* Heading only — stays at top */}
      <Text style={[styles.heroGreeting, localStyles.heading]}>{greeting}</Text>

      {/* Einstein — centered in remaining space */}
      <View style={localStyles.einsteinSection}>
        <DecorativeIllustration
          source={einsteinIllustration}
          width={einsteinSize}
          height={einsteinSize}
        />
      </View>

      {/* Bottom: body text → atom → button → sign in, all stacked tight */}
      <View style={localStyles.bottomSection}>
        <Text style={[styles.heroBody, localStyles.bodyText]}>
          Chrono curates one luminous moment from history every day. We will
          tune the timeline so it fits your curiosity.
        </Text>

        <View pointerEvents="box-none" style={localStyles.atomWrap}>
          <DecorativeIllustration
            source={atomIllustration}
            width={ATOM_SIZE}
            height={ATOM_SIZE}
            opacity={0.4}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            localStyles.fullWidthButton,
            pressed && styles.primaryButtonPressed,
          ]}
          onPress={handleBegin}
        >
          <Text style={styles.primaryButtonText}>Start Your Journey</Text>
        </Pressable>

        <Pressable onPress={handleLogin}>
          <Text style={styles.ghostLink}>Already have a pass? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: spacingScale.lg,
    alignItems: "center",
  },
  einsteinSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  bodyText: {
    textAlign: "center",
    paddingHorizontal: spacingScale.xl,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    gap: spacingScale.xs,
  },
  atomWrap: {
    alignItems: "center",
    // atom.png has ~40% transparent space at top — pull up to close the visual gap
    marginTop: -Math.round(ATOM_SIZE * 0.42),
    marginBottom: -20,
  },
  fullWidthButton: {
    flex: 0,
    width: "100%",
    marginBottom: spacingScale.md,
  },
});

export default StepWelcome;
