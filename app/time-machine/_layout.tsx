import React from 'react';
import { Stack } from 'expo-router';

const TimeMachineStack = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" options={{ headerShown: false }} />
  </Stack>
);

export default TimeMachineStack;
