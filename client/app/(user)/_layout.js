import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="booking" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="payment" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ticket" options={{ gestureEnabled: false }} />
      <Stack.Screen name="my-bookings" />
      <Stack.Screen name="parking-details" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="search" />
      <Stack.Screen name="user-home" />
    </Stack>
  );
}
