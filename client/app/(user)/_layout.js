import { Tabs } from 'expo-router';
import UserBottomNavbar from '../../components/UserBottomNavbar';

export default function UserLayout() {
  return (
    <Tabs 
      tabBar={(props) => <UserBottomNavbar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen 
        name="user-home" 
        options={{ 
          tabBarLabel: 'Home',
        }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{ 
          tabBarLabel: 'Explore',
        }} 
      />
      <Tabs.Screen 
        name="saved" 
        options={{ 
          tabBarLabel: 'Saved',
        }} 
      />
      <Tabs.Screen 
        name="my-bookings" 
        options={{ 
          tabBarLabel: 'Bookings',
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          tabBarLabel: 'Profile',
        }} 
      />
      
      {/* Hide these from Bottom Navbar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="parking-details" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="booking" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="slot-selection" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="payment" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ticket" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
