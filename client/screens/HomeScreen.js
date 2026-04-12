import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyBookingsScreen from './MyBookingsScreen';
import UserHomeScreen from './UserHomeScreen';
import SavedParkingScreen from './SavedParkingScreen';

// Placeholder Screens
import ProfileScreen from './ProfileScreen';

export default function HomeScreen({ navigation }) {
  // Using 1 for Bookings as in the screenshot, the highlighted item is the 2nd one.
  const [currentIndex, setCurrentIndex] = useState(1);

  const renderScreen = () => {
    switch (currentIndex) {
      case 0: return <UserHomeScreen />;
      case 1: return <MyBookingsScreen />;  
      case 2: return <SavedParkingScreen />;
      case 3: return <ProfileScreen navigation={navigation} />;
      default: return <MyBookingsScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      
      {/* Floating Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.floatingNav}>
          <NavItem 
            iconName={currentIndex === 0 ? "home" : "home-outline"} 
            label="Home" 
            isActive={currentIndex === 0}
            onPress={() => setCurrentIndex(0)} 
          />
          <NavItem 
            iconName={currentIndex === 1 ? "ticket" : "ticket-outline"} 
            label="Bookings" 
            isActive={currentIndex === 1}
            onPress={() => setCurrentIndex(1)} 
          />
          <NavItem 
            iconName={currentIndex === 2 ? "bookmark" : "bookmark-outline"} 
            label="Bookmarks" 
            isActive={currentIndex === 2}
            onPress={() => setCurrentIndex(2)} 
          />
          <NavItem 
            iconName={currentIndex === 3 ? "person" : "person-outline"} 
            label="Profile" 
            isActive={currentIndex === 3}
            onPress={() => setCurrentIndex(3)} 
          />
        </View>
      </View>
    </View>
  );
}

// Reusable Bottom Navigation Item Component exactly matching the image
const NavItem = ({ iconName, label, isActive, onPress }) => {
  if (isActive) {
    return (
      <TouchableOpacity style={styles.activePill} onPress={onPress}>
        <Ionicons name={iconName} size={20} color="#FFFFFF" />
        <Text style={styles.activeLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={iconName} size={26} color="#8E8E93" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // To match design
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4C4223',
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  tokenText: {
    color: '#8E8E93',
    marginBottom: 30,
    textAlign: 'center'
  },
  logoutButton: {
    backgroundColor: '#FBD427',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    fontWeight: 'bold',
    color: '#4C4223',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 40,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  navItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  activePill: {
    flexDirection: 'row',
    backgroundColor: '#A08A38', // The olive/brown color from design
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  }
});
