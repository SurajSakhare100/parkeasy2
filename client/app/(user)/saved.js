import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import { useRouter, useIsFocused } from 'expo-router';
import userService from '../../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

// Default parking images if none provided — cycles through 3 curated photos
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400&fit=crop',
  'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=400&fit=crop',
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&fit=crop',
  'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=400&fit=crop',
];

export default function SavedParkingScreen() {
  const navigation = useRouter();
  const isFocused = useIsFocused();
  const { theme, isDarkMode } = useTheme();
  const [savedLocations, setSavedLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAndLoad = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token && isFocused) {
        loadSavedParkings();
      }
    };
    checkAndLoad();
  }, [isFocused]);

  const loadSavedParkings = async () => {
    try {
      setLoading(true);
      const data = await userService.getSavedParkings();
      setSavedLocations(data);
    } catch (error) {
      console.error("Error loading saved parkings:", error);
      if (error.response && error.response.status === 401) {
        // Token is invalid or expired
        navigation.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} 
      activeOpacity={0.8}
      onPress={() => navigation.push({ pathname: '/parking-details', params: { parking: JSON.stringify(item) } })}
    >
      <Image 
        source={{ uri: item.images?.[0] || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.cardAddress, { color: theme.textLight }]}>{item.address || item.locationText}</Text>
      </View>
      <View style={styles.bookmarkIcon}>
        <Ionicons name="bookmark" size={24} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Saved Parking</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : savedLocations.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 50, color: theme.textLight }}>No saved parkings found.</Text>
      ) : (
        <FlatList
          data={savedLocations}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerTitle: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: '#4C4223',
    textAlign: 'center',
    marginVertical: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120, // ample space for the bottom floating nav
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    ...SHADOWS.light,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#EEE',
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  bookmarkIcon: {
    padding: 10,
  }
});
