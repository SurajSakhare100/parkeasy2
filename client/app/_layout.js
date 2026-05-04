import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  const segments = useSegments();
  // ← KEY FIX: navigationState.key is undefined until the navigator is mounted.
  // Without this guard, router.replace() fires too early and silently fails,
  // leaving the app stuck on the loading screen forever.
  const navigationState = useRootNavigationState();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userStr = await AsyncStorage.getItem('user');

        setHasToken(!!token);
        if (userStr) {
          const userObj = JSON.parse(userStr);
          setUserRole(userObj.role);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!navigationState?.key) return; // Navigation not ready yet — wait for it

    const inAuthGroup = segments[0] === '(auth)';
    const inUserGroup = segments[0] === '(user)';
    const inOwnerGroup = segments[0] === '(owner)';

    if (!hasToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (hasToken) {
      if (userRole === 'owner') {
        if (inUserGroup || inAuthGroup) {
          router.replace('/(owner)/home');
        }
      } else if (userRole === 'customer') {
        if (inOwnerGroup || inAuthGroup) {
          router.replace('/(user)/user-home');
        }
      } else if (inAuthGroup) {
        router.replace('/(user)/user-home');
      }
    }
  }, [hasToken, userRole, segments, isLoading, navigationState?.key]);

  useEffect(() => {
    const authListener = DeviceEventEmitter.addListener('auth_error', () => {
      setHasToken(false);
      setUserRole(null);
      router.replace('/(auth)/login');
    });

    const successListener = DeviceEventEmitter.addListener('auth_success', (data) => {
      setHasToken(true);
      if (data?.user?.role) {
        setUserRole(data.user.role);
      }
    });

    return () => {
      authListener.remove();
      successListener.remove();
    };
  }, [router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7F2' }}>
        <ActivityIndicator size="large" color="#FBD427" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="(owner)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
