import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import FilterModal from '../../components/FilterModal';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import parkingService from '../../services/parkingService';
import userService from '../../services/userService';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FALLBACK_PARKING_IMAGES = [
  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&fit=crop',
  'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&fit=crop',
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&fit=crop',
  'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=800&fit=crop',
];

// Keys for persisting location permission + last known coords
const LOC_PERMISSION_KEY = 'locationPermissionGranted';
const LOC_CITY_KEY       = 'lastKnownCity';
const LOC_COORDS_KEY     = 'lastKnownCoords';

export default function UserHomeScreen() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [cityName, setCityName] = useState('Locating…');
  const [allParkings, setAllParkings] = useState([]);   // master list (never mutated)
  const [parkings, setParkings] = useState([]);          // filtered / sorted view
  const [activeFilters, setActiveFilters] = useState(null); // null = no filter active
  const [selectedParking, setSelectedParking] = useState(null);
  const [region, setRegion] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const mapRef = useRef(null);
  const navigation = useRouter();
  const isFocused = useIsFocused();
  const [savedParkingIds, setSavedParkingIds] = useState([]);

  // ─── Apply filters to the master parking list ───────────────────────────────
  const applyFilters = (all, filters) => {
    if (!filters) return all;
    let result = [...all];

    // Max price
    if (filters.maxPrice) {
      result = result.filter(p => p.pricePerHour <= parseFloat(filters.maxPrice));
    }
    // Vehicle type
    if (filters.vehicleType && filters.vehicleType !== 'all') {
      result = result.filter(p =>
        Array.isArray(p.vehicleType)
          ? p.vehicleType.includes(filters.vehicleType)
          : p.vehicleType === filters.vehicleType
      );
    }
    // Available only
    if (filters.availableOnly === 'true') {
      result = result.filter(p => p.availableSlots > 0);
    }
    // Sort
    if (filters.sortBy === 'price_asc')  result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    if (filters.sortBy === 'price_desc') result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    if (filters.sortBy === 'slots')      result.sort((a, b) => b.availableSlots - a.availableSlots);

    return result;
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    const filtered = applyFilters(allParkings, filters);
    setParkings(filtered);
    const first = filtered[0] || null;
    setSelectedParking(first);
    // If we have a first result, center map on it
    if (first && mapRef.current) {
      const next = {
        latitude: first.location.coordinates[1],
        longitude: first.location.coordinates[0],
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(next);
      mapRef.current.animateToRegion(next, 600);
    }
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setParkings(allParkings);
    setSelectedParking(allParkings[0] || null);
  };

  const activeFilterCount = activeFilters
    ? Object.values(activeFilters).filter(
        v => v && v !== 'distance' && v !== 'all' && v !== 'false'
      ).length
    : 0;

  // ─── Location: ask once, persist result ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // 1. Check if we already got permission before
        const cached = await AsyncStorage.getItem(LOC_PERMISSION_KEY);

        let granted = cached === 'true';
        if (!granted) {
          // Ask the user ONCE
          const { status } = await Location.requestForegroundPermissionsAsync();
          granted = status === 'granted';
          await AsyncStorage.setItem(LOC_PERMISSION_KEY, granted ? 'true' : 'false');
        }

        if (!granted) {
          // Restore last known city from cache if any
          const savedCity   = await AsyncStorage.getItem(LOC_CITY_KEY);
          const savedCoords = await AsyncStorage.getItem(LOC_COORDS_KEY);
          if (savedCity)   setCityName(savedCity);
          if (savedCoords) {
            const c = JSON.parse(savedCoords);
            setUserLocation(c);
            setRegion(r => ({ ...r, latitude: c.latitude, longitude: c.longitude }));
          }
          return;
        }

        // 2. Get real GPS position
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(coords);

        // 3. Center map on user
        setRegion(r => ({ ...r, ...coords }));
        mapRef.current?.animateToRegion({ ...region, ...coords }, 800);

        // 4. Reverse-geocode to get real city name
        const [place] = await Location.reverseGeocodeAsync(coords);
        const city = place?.city || place?.subregion || place?.region || 'Unknown';
        const area = place?.district || place?.subregion || city;
        setCityName(`${area}, ${place?.region || 'India'}`);

        // 5. Persist for next launch (don't re-fetch immediately)
        await AsyncStorage.setItem(LOC_CITY_KEY, `${area}, ${place?.region || 'India'}`);
        await AsyncStorage.setItem(LOC_COORDS_KEY, JSON.stringify(coords));

      } catch (err) {
        console.error('Location error:', err);
        setCityName('Location unavailable');
      }
    })();

    fetchParkings();
  }, []);

  useEffect(() => {
    const checkAndFetch = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token && isFocused) {
        fetchSavedParkingIds();
      }
    };
    checkAndFetch();
  }, [isFocused]);

  const fetchSavedParkingIds = async () => {
    try {
      const data = await userService.getSavedParkings();
      setSavedParkingIds(data.map(p => p._id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleToggleBookmark = async (parkingId) => {
    try {
      await userService.toggleSavedParking(parkingId);
      setSavedParkingIds(prev =>
        prev.includes(parkingId)
          ? prev.filter(id => id !== parkingId)
          : [...prev, parkingId]
      );
    } catch (error) {
      console.error(error);
    }
  };

  const fetchParkings = async () => {
    try {
      const coordsParam = userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : {};
      const data = await parkingService.searchParkings('', coordsParam);
      setAllParkings(data);                        // store master
      setParkings(data);                           // show all by default
      if (data.length > 0) setSelectedParking(data[0]);
    } catch (error) {
      // Error logged in api.js interceptor
    }
  };

  const handleMarkerPress = (parking) => {
    setSelectedParking(parking);
    setRegion(r => ({
      ...r,
      latitude: parking.location.coordinates[1],
      longitude: parking.location.coordinates[0],
    }));
  };

  // Jump to next parking card and zoom map
  const handleNextCard = () => {
    if (!parkings || parkings.length === 0) return;
    const idx = parkings.findIndex(p => selectedParking && p._id === selectedParking._id);
    const nextIdx = idx < 0 ? 0 : (idx + 1) % parkings.length;
    const next = parkings[nextIdx];
    if (!next) return;
    setSelectedParking(next);
    const nextRegion = {
      latitude: next.location.coordinates[1],
      longitude: next.location.coordinates[0],
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 600);
  };

  // Jump to previous parking card and zoom map
  const handlePrevCard = () => {
    if (!parkings || parkings.length === 0) return;
    const idx = parkings.findIndex(p => selectedParking && p._id === selectedParking._id);
    const prevIdx = idx < 0 ? 0 : (idx - 1 + parkings.length) % parkings.length;
    const prev = parkings[prevIdx];
    if (!prev) return;
    setSelectedParking(prev);
    const prevRegion = {
      latitude: prev.location.coordinates[1],
      longitude: prev.location.coordinates[0],
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(prevRegion);
    mapRef.current?.animateToRegion(prevRegion, 600);
  };

  // Button to snap map back to user's position
  const handleCenterOnUser = () => {
    if (userLocation) {
      const next = { ...region, ...userLocation };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 600);
    }
  };

  return (
    <View style={styles.container}>
      {/* Real Google Map — showsUserLocation shows the blue dot */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}   // we render our own button
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
                source={require('../../assets/parkMarker.png')}
                style={styles.markerIcon}
              />
              <View style={styles.pinPrice}>
                <Text style={styles.pinPriceText}>₹{parking.pricePerHour}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Light overlay */}
      <View style={styles.mapOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <View style={styles.locationIconWrapper}>
              <Ionicons name="location" size={18} color="#A08A38" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Your location</Text>
              <Text style={styles.locationText} numberOfLines={1}>{cityName}</Text>
            </View>
            <TouchableOpacity style={styles.bellIcon}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.searchInputMock}
              onPress={() => navigation.push('/search')}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={20} color={COLORS.oliveDark} style={{ marginRight: 10 }} />
              <Text style={{ color: COLORS.textLight, flex: 1, fontSize: SIZES.medium }}>
                Search for parking
              </Text>
            </TouchableOpacity>
            {/* Filter button with active badge */}
            <TouchableOpacity style={styles.filterIcon} onPress={() => setFilterVisible(true)}>
              <Ionicons
                name="options-outline"
                size={22}
                color={activeFilterCount > 0 ? COLORS.oliveDark : COLORS.oliveDark}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Active filter chip — tap to clear */}
          {activeFilters && (
            <TouchableOpacity style={styles.activeFilterChip} onPress={handleClearFilters}>
              <Ionicons name="funnel" size={12} color="#333" style={{ marginRight: 4 }} />
              <Text style={styles.activeFilterChipText}>
                {parkings.length} result{parkings.length !== 1 ? 's' : ''} · Tap to clear
              </Text>
              <Ionicons name="close-circle" size={14} color="#555" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Recenter-to-user FAB */}
        {userLocation && (
          <TouchableOpacity style={styles.myLocationBtn} onPress={handleCenterOnUser}>
            <Ionicons name="locate" size={22} color={COLORS.oliveDark} />
          </TouchableOpacity>
        )}

        {/* Bottom Card */}
        {selectedParking && (
          <View style={styles.bottomCardContainer}>
            <TouchableOpacity
              style={styles.parkingCard}
              activeOpacity={0.9}
              onPress={() =>
                navigation.push({ pathname: '/parking-details', params: { parking: JSON.stringify(selectedParking) } })
              }
            >
              <Image
                source={{
                  uri: selectedParking.images?.[0] ||
                    FALLBACK_PARKING_IMAGES[parkings.indexOf(selectedParking) % FALLBACK_PARKING_IMAGES.length],
                }}
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
                  <Text style={styles.priceText}>
                    ₹{selectedParking.pricePerHour}<Text style={styles.priceUnit}>/hr</Text>
                  </Text>
                  <Text style={styles.availabilityText}>{selectedParking.availableSlots} spots left</Text>
                  {selectedParking.distanceText && (
                    <Text style={[styles.availabilityText, { marginTop: 4 }]}>{selectedParking.distanceText}</Text>
                  )}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => handleToggleBookmark(selectedParking._id)}
                  >
                    <Ionicons
                      name={savedParkingIds.includes(selectedParking._id) ? 'bookmark' : 'bookmark-outline'}
                      size={22}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() =>
                      navigation.push({
                        pathname: '/parking-details',
                        params: { parking: JSON.stringify(selectedParking) },
                      })
                    }
                  >
                    <Text style={styles.bookBtnText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>

            {/* Previous card button */}
            <TouchableOpacity style={styles.prevCardBtn} onPress={handlePrevCard}>
              <Ionicons name="chevron-back" size={24} color={COLORS.surface} />
            </TouchableOpacity>

            {/* Next card button */}
            <TouchableOpacity style={styles.nextCardBtn} onPress={handleNextCard}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={(filters) => {
          handleApplyFilters(filters);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  customMarker: { alignItems: 'center', justifyContent: 'center' },
  markerIcon: { width: 35, height: 35, resizeMode: 'contain' },
  selectedMarker: { transform: [{ scale: 1.2 }], zIndex: 99 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
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
  locationLabel: { fontSize: 12, color: '#8E8E93' },
  locationText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: '#333',
    maxWidth: 200,
  },
  bellIcon: {
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
  searchInputMock: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  filterIcon: {
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  // Recenter FAB — bottom-right above card
  myLocationBtn: {
    position: 'absolute',
    right: 20,
    bottom: 280,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  nextCardBtn: {
    position: 'absolute',
    right: 6,
    top: '50%',
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  prevCardBtn: {
    position: 'absolute',
    left: 6,
    top: '50%',
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  pinPriceText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  parkingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
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
  cardAddress: { fontSize: SIZES.small, color: COLORS.textLight },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: SIZES.medium, fontWeight: 'bold', marginLeft: 4 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: { fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.olive },
  priceUnit: { fontSize: SIZES.font, color: COLORS.textLight, fontWeight: 'normal' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  bookmarkBtn: { marginRight: 15 },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookBtnText: { fontWeight: 'bold', color: '#333', fontSize: SIZES.font },
  availabilityText: { fontSize: 12, color: '#666', marginTop: 2 },
});
