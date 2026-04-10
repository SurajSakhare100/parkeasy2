import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ParkingDetailsScreen from './screens/ParkingDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Dashboard', headerShown: false }} // hide header since Home handles it
        />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ headerShown: false, animation: 'fade' }} 
        />
        <Stack.Screen 
          name="ParkingDetails" 
          component={ParkingDetailsScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
