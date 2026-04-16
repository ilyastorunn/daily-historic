import { Image, Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { useOnboardingContext } from "@/contexts/onboarding-context";
import { useAppTheme } from "@/theme";

import type { StepComponentProps } from "../types";

const serifFamily = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});
const sansFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

const StepName = ({ onNext }: StepComponentProps) => {
  const { state, updateState } = useOnboardingContext();
  const theme = useAppTheme();

  const handleNameChange = (text: string) => {
    updateState({ displayName: text });
  };

  return (
    <View style={localStyles.container}>
      <View style={localStyles.typingContainer}>
        <Text style={[localStyles.title, { color: theme.colors.textPrimary }]}>
          Hi, I&apos;m Chrono. What should I call you?
        </Text>
      </View>

      <View style={localStyles.mascotArea}>
        <Image
          source={require("../../../assets/mascot/deneme.png")}
          style={localStyles.mascot}
          resizeMode="contain"
        />
      </View>

      <View style={localStyles.inputArea}>
        <TextInput
          style={[
            localStyles.nameInput,
            {
              color: theme.colors.textSecondary,
            },
          ]}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textSecondary}
          value={state.displayName}
          onChangeText={handleNameChange}
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
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 12,
  },
  typingContainer: {
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  title: {
    fontFamily: serifFamily,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: "400",
  },
  mascotArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  mascot: {
    width: "108%",
    maxWidth: 520,
    height: 480,
    marginBottom: -28,
  },
  inputArea: {
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 30,
    width: "100%",
    gap: 10,
  },
  nameInput: {
    fontFamily: sansFamily,
    fontSize: 33,
    lineHeight: 40,
    letterSpacing: -0.3,
    width: "100%",
    minHeight: 72,
    paddingVertical: 10,
    includeFontPadding: false,
  },
});

export default StepName;
