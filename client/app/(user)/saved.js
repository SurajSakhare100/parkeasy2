import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import { useRouter, useIsFocused } from 'expo-router';
import userService from '../../services/userService';

// Default parking image if none provided
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=200&fit=crop";

export default function SavedParkingScreen() {
  const navigation = useRouter();
  const isFocused = useIsFocused();
  const [savedLocations, setSavedLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      loadSavedParkings();
    }
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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => navigation.push({ pathname: '/parking-details', params: { parking: JSON.stringify(item) } })}
    >
      <Image source={{ uri: item.image || item.images?.[0] || DEFAULT_IMAGE }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardAddress}>{item.address || item.locationText}</Text>
      </View>
      <View style={styles.bookmarkIcon}>
        <Ionicons name="bookmark" size={24} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.headerTitle}>Saved Parking</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : savedLocations.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 50, color: COLORS.textMuted }}>No saved parkings found.</Text>
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
