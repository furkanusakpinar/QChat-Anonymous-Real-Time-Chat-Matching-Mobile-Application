import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MatchmakingScreen } from '../screens/MatchmakingScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { useStore } from '../redux/useStore';
import { getCachedUser, getCachedLanguage } from '../utils/cache';
import { ensureFirebase } from '../utils/firebase';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setLanguage = useStore((state) => state.setLanguage);
  const navKey = useStore((state) => state.navKey);
  const isLoggedIn = user?.isLoggedIn;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureFirebase();
      const cached = await getCachedUser();
      if (cached && cached.isLoggedIn) {
        setUser(cached);
      }
      const lang = await getCachedLanguage();
      setLanguage(lang);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer key={navKey} theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.background, primary: colors.primary } }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250 }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Group screenOptions={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Group>
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'slide_from_bottom' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};