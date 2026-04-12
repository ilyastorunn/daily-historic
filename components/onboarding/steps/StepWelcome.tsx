import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useOnboardingContext } from "@/contexts/onboarding-context";
import { useAppTheme } from "@/theme";

import { createOnboardingStyles, spacingScale } from "../styles";
import type { StepComponentProps } from "../types";

const StepWelcome = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const router = useRouter();
  const theme = useAppTheme();
  const { styles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const displayName = state.displayName.trim();
  const greeting = displayName ? `Hello, ${displayName}!` : "Hello!";

  const handleBegin = () => {
    updateState({ heroPreviewSeen: true });
    onNext();
  };

  const handleLogin = () => {
    router.replace({
      pathname: "/onboarding",
      params: {
        step: "account",
        ...(displayName ? { displayName } : {}),
      },
    });
  };

  return (
    <View style={localStyles.container}>
      {/* Heading only — stays at top */}
      <Text style={[styles.heroGreeting, localStyles.heading]}>{greeting}</Text>

      {/* Einstein — centered in remaining space */}
      <View style={localStyles.einsteinSection}>
        <Text style={[styles.heroBody, localStyles.bodyText]}>
          Chrono curates one luminous moment from history every day. We will
          tune the timeline so it fits your curiosity.
        </Text>
      </View>

      {/* Bottom: actions */}
      <View style={localStyles.bottomSection}>
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
    gap: spacingScale.md,
  },
  fullWidthButton: {
    flex: 0,
    width: "100%",
    marginBottom: spacingScale.md,
  },
});

export default StepWelcome;
