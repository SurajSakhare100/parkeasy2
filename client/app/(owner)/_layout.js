import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OwnerBottomNavbar from '../../components/OwnerBottomNavbar';

export default function OwnerLayout() {
  return (
    <Tabs
      tabBar={(props) => <OwnerBottomNavbar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="my-parkings"
        options={{
          tabBarLabel: 'Parkings',
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarLabel: 'Bookings',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarLabel: 'Stats',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
        }}
      />
      <Tabs.Screen name="add-parking" options={{ href: null }} />
      <Tabs.Screen name="edit-parking" options={{ href: null }} />
      <Tabs.Screen name="parking-details" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}