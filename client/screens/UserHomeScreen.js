import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../theme';
import FilterModal from '../components/FilterModal';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import parkingService from '../services/parkingService';

export default function UserHomeScreen() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [region, setRegion] = useState({
    latitude: 18.5204, // Default to Pune
    longitude: 73.8567,
    latitudeDelta: 0.05, // Slightly wider to show all 3 new locations
    longitudeDelta: 0.05,
  });

  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      // Only auto-center if we don't have parking spots yet or user wants to center
    })();

    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    try {
      const data = await parkingService.getAllParkings();
      setParkings(data);
      if (data.length > 0) {
        setSelectedParking(data[0]); // Select first one by default
        // Center map on first parking
        setRegion({
          ...region,
          latitude: data[0].location.coordinates[1],
          longitude: data[0].location.coordinates[0],
        });
      }
    } catch (error) {
      // Error is already logged in api.js interceptor
    }
  };

  const handleMarkerPress = (parking) => {
    setSelectedParking(parking);
    // Smoothly pan to the selected parking
    setRegion({
      ...region,
      latitude: parking.location.coordinates[1],
      longitude: parking.location.coordinates[0],
    });
  };

  return (
    <View style={styles.container}>
      {/* Real Google Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {parkings.map((parking) => (
          <Marker
            key={parking._id}
            coordinate={{
              latitude: parking.location.coordinates[1],
              longitude: parking.location.coordinates[0],
            }}
            onPress={() => handleMarkerPress(parking)}
          >
            <View style={[
              styles.customMarker, 
              selectedParking?._id === parking._id && styles.selectedMarker
            ]}>
              <Image 
                source={require('../assets/parkicon.png')} 
                style={styles.markerIcon} 
              />
              <View style={styles.pinPrice}>
                <Text style={styles.pinPriceText}>₹{parking.pricePerHour}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Semi-transparent overlay to make elements pop */}
      <View style={styles.mapOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Section */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <View style={styles.locationIconWrapper}>
              <Ionicons name="location" size={18} color="#A08A38" />
            </View>
            <View>
              <Text style={styles.locationLabel}>Location</Text>
              <Text style={styles.locationText}>
                {selectedParking ? selectedParking.name.split(' ')[0] : 'Pune'}, Maharashtra
              </Text>
            </View>
            <TouchableOpacity style={styles.bellIcon}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TouchableOpacity 
              style={styles.searchInputMock} 
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={20} color={COLORS.oliveDark} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.textLight, flex: 1, fontSize: SIZES.medium }}>Search for parking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterIcon} onPress={() => setFilterVisible(true)}>
              <Ionicons name="options-outline" size={22} color={COLORS.oliveDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Card Area */}
        {selectedParking && (
          <View style={styles.bottomCardContainer}>
            <TouchableOpacity 
              style={styles.parkingCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ParkingDetails', { parking: selectedParking })}
            >
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=400&fit=crop' }} 
                style={styles.parkingImage} 
              />
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{selectedParking.name}</Text>
                  <Text style={styles.cardAddress} numberOfLines={1}>{selectedParking.address}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={16} color={COLORS.primary} />
                  <Text style={styles.ratingText}>4.5</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.priceText}>₹{selectedParking.pricePerHour}<Text style={styles.priceUnit}>/hr</Text></Text>
                  <Text style={styles.availabilityText}>
                    {selectedParking.availableSlots} spots left
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.bookmarkBtn}>
                    <Ionicons name="bookmark-outline" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.bookBtn} 
                    onPress={() => navigation.navigate('ParkingDetails', { parking: selectedParking })}
                  >
                    <Text style={styles.bookBtnText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

      </SafeAreaView>

      <FilterModal 
        visible={filterVisible} 
        onClose={() => setFilterVisible(false)} 
        onApply={(filters) => {
          console.log("Applied Filters:", filters);
          // In a real app we'd dispatch filtering logic here!
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Lighter overlay for better map visibility
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  locationText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: '#333',
  },
  bellIcon: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...SHADOWS.light,
  },
  searchInputMock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    ...SHADOWS.medium,
  },
  pinPrice: {
    position: 'absolute',
    bottom: -15,
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pinPriceText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  parkingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 15,
    ...SHADOWS.medium,
  },
  parkingImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.olive,
  },
  priceUnit: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
    fontWeight: 'normal',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkBtn: {
    marginRight: 15,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookBtnText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: SIZES.font,
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
    zIndex: 99,
  }
});
