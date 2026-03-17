import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { useOnboardingContext } from "@/contexts/onboarding-context";
import { useAppTheme } from "@/theme";

import DecorativeIllustration from "../DecorativeIllustration";
import { createOnboardingStyles } from "../styles";
import type { StepComponentProps } from "../types";

const serifFamily = Platform.select({
  ios: "Times New Roman",
  android: "serif",
  default: "serif",
});
const sansFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});
const moonLandingIllustration = require("@/assets/illustrations/MoonLanding2.png");

const StepName = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();
  const { styles: onboardingStyles } = useMemo(() => createOnboardingStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  const handleNameChange = (text: string) => {
    updateState({ displayName: text });
  };

  return (
    <View style={localStyles.container}>
      <View
        pointerEvents="box-none"
        style={[
          onboardingStyles.footerAnchoredScene,
          localStyles.illustrationScene,
        ]}
      >
        <DecorativeIllustration
          source={moonLandingIllustration}
          widthRatio={0.55}
          minWidth={222}
          maxWidth={273}
          right={0}
          bottom={-28}
        />
      </View>

      <View style={localStyles.content}>
        <View style={localStyles.masthead}>
          <Text
            style={[localStyles.greeting, { color: theme.colors.textPrimary }]}
          >
            Welcome, Time Voyager
          </Text>
          <Text
            style={[localStyles.subtext, { color: theme.colors.textSecondary }]}
          >
            How should we call you? Let&apos;s personalize your journey through
            history.
          </Text>
        </View>

        <View style={localStyles.inputArea}>
          <TextInput
            style={[
              localStyles.nameInput,
              {
                color: theme.colors.textPrimary,
                borderBottomColor: focused
                  ? theme.colors.accentPrimary
                  : theme.colors.borderSubtle,
              },
            ]}
            placeholder="Your name"
            placeholderTextColor={theme.colors.textTertiary}
            value={state.displayName}
            onChangeText={handleNameChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onNext}
            maxLength={50}
            textAlign="center"
            autoFocus
          />
        </View>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 0,
    position: "relative",
    overflow: "visible",
  },
  content: {
    gap: 48,
    position: "relative",
  },
  illustrationScene: {
    bottom: -10,
  },
  masthead: {
    alignItems: "center",
    gap: 12,
  },
  greeting: {
    fontFamily: serifFamily,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtext: {
    fontFamily: sansFamily,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  inputArea: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  nameInput: {
    fontFamily: serifFamily,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
    width: "100%",
    borderBottomWidth: 1.5,
    paddingBottom: 10,
    paddingTop: 4,
  },
});

export default StepName;
