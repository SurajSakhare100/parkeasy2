import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import userService from '../../services/userService';
import { useTheme } from '../../context/ThemeContext';

import DetailsHeaderCarousel from '../../components/DetailsHeaderCarousel';
import DetailsInfoSection from '../../components/DetailsInfoSection';
import OwnerContactCard from '../../components/OwnerContactCard';
import BottomBookingBar from '../../components/BottomBookingBar';

export default function ParkingDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();

  const parking = params?.parking
    ? (typeof params.parking === 'string' ? JSON.parse(params.parking) : params.parking)
    : null;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);

  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        if (!parking?._id) return;
        const saved = await userService.getSavedParkings();
        if (saved.some(p => p._id === parking._id)) setIsBookmarked(true);
      } catch (err) {
        console.log(err);
      }
    };
    checkSavedStatus();
  }, [parking?._id]);

  const handleToggleBookmark = async () => {
    if (!parking?._id) return;
    try {
      setLoadingBookmark(true);
      await userService.toggleSavedParking(parking._id);
      setIsBookmarked(prev => !prev);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBookmark(false);
    }
  };

  const handleBookNow = () => {
    if (!parking) return;
    router.push({ 
      pathname: '/(user)/booking', 
      params: { 
        parking: JSON.stringify(parking)
      } 
    });
  };

  if (!parking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  // ── Computed values from parking data ──────────────────────
  const images = parking.images?.length > 0 ? parking.images : undefined;

  // Format operating hours from startTime/endTime fields
  const formatHour = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${suffix}`;
  };

  const operatingHours =
    parking.startTime && parking.endTime
      ? `${formatHour(parking.startTime)} – ${formatHour(parking.endTime)}`
      : '24 Hours';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Image Carousel (uses real images from Cloudinary or fallbacks) */}
        <DetailsHeaderCarousel 
          images={images} 
          isBookmarked={isBookmarked}
          onBookmarkPress={handleToggleBookmark}
          loadingBookmark={loadingBookmark}
        />

        {/* Main Info: title, address, hours, spots, about/description */}
        <DetailsInfoSection
          title={parking.name}
          address={parking.address}
          rating={4.5}
          time={operatingHours}
          about={parking.description || 'A convenient and secure parking space.'}
          spots={parking.spots || []}
          vehicleTypes={parking.vehicleType || []}
          amenities={parking.amenities || ['CCTV Surveillance', '24/7 Security', 'Well Lit', 'Covered Parking']}
        />

        {/* Owner Contact */}
        <OwnerContactCard
          ownerName={parking.ownerName || 'ParkEasy Owner'}
          ownerAvatar="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&fit=crop"
        />

      </ScrollView>



      {/* Bottom Book Now Bar */}
      <BottomBookingBar
        price={`₹${parking.pricePerHour ?? '—'}/hr`}
        onBookNow={handleBookNow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  scrollContent: {
    paddingBottom: 120,
  },
});
