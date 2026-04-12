import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OwnerLayout() { 
  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: '#4C4223',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingBottom: 5,
        paddingTop: 5,
      }
    }}>
      <Tabs.Screen 
        name="home" 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="my-parkings" 
        options={{
          tabBarLabel: 'Parkings',
          tabBarIcon: ({ color }) => <Ionicons name="car" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="bookings" 
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
      <Tabs.Screen name="add-parking" options={{ href: null }} />
      <Tabs.Screen name="edit-parking" options={{ href: null }} />
      <Tabs.Screen name="parking-details" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  ); 
}