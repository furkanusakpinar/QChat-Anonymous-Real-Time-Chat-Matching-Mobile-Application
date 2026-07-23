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

import { FirebaseSetupModal } from '../components/FirebaseSetupModal';
import { useStore } from '../redux/useStore';
import { getCachedUser, getCachedLanguage } from '../utils/cache';
import { ensureFirebase, isFirebaseConfigured } from '../utils/firebase';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setLanguage = useStore((state) => state.setLanguage);
  const navKey = useStore((state) => state.navKey);
  const isLoggedIn = user?.isLoggedIn;
  const [loading, setLoading] = useState(true);
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(false);

  useEffect(() => {
    (async () => {
      const configured = await isFirebaseConfigured();
      if (!configured) {
        setShowFirebaseSetup(true);
        setLoading(false);
        return;
      }
      try {
        await ensureFirebase();
      } catch {
        setShowFirebaseSetup(true);
        setLoading(false);
        return;
      }
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

  if (showFirebaseSetup) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FirebaseSetupModal visible onClose={() => {
          setShowFirebaseSetup(false);
          setLoading(true);
          // restart setup
          setTimeout(() => {
            (async () => {
              const configured = await isFirebaseConfigured();
              if (!configured) {
                setShowFirebaseSetup(true);
                setLoading(false);
                return;
              }
              try {
                await ensureFirebase();
              } catch {
                setShowFirebaseSetup(true);
                setLoading(false);
                return;
              }
              const cached = await getCachedUser();
              if (cached && cached.isLoggedIn) {
                setUser(cached);
              }
              const lang = await getCachedLanguage();
              setLanguage(lang);
              setLoading(false);
            })();
          }, 300);
        }} />
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