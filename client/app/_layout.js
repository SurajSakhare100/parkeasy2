import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  const segments = useSegments();

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
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  useEffect(() => {
    if (isLoading) return;

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
          router.replace('/(user)/my-bookings');
        }
      } else if (inAuthGroup) {
        router.replace('/(user)/my-bookings');
      }
    }
  }, [hasToken, userRole, segments, isLoading]);

  useEffect(() => {
    // Listen for global authentication failures from API interceptor
    const authListener = DeviceEventEmitter.addListener('auth_error', () => {
      setHasToken(false); // Update state so the dependency arrays trigger layout update natively
      router.replace('/(auth)/login'); // Trigger navigation from within safe React context
    });

    return () => authListener.remove();
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
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="(owner)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
