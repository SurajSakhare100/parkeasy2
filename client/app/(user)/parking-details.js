import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import userService from '../../services/userService';

import DetailsHeaderCarousel from '../../components/DetailsHeaderCarousel';
import DetailsInfoSection from '../../components/DetailsInfoSection';
import OwnerContactCard from '../../components/OwnerContactCard';
import BottomBookingBar from '../../components/BottomBookingBar';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=800&fit=crop',
  'https://images.unsplash.com/photo-1621245645607-bb561332f7cc?w=800&fit=crop',
];

export default function ParkingDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const parking = params?.parking ? JSON.parse(params.parking) : null;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);

  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        if (!parking?._id) return;
        const saved = await userService.getSavedParkings();
        if (saved.some(p => p._id === parking._id)) {
          setIsBookmarked(true);
        }
      } catch (err) {
        console.log(err);
      }
    };
    checkSavedStatus();
  }, [parking]);

  const handleToggleBookmark = async () => {
    if (!parking?._id) return;
    try {
      setLoadingBookmark(true);
      await userService.toggleSavedParking(parking._id);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBookmark(false);
    }
  };

  const details = {
    title: parking?.name || 'Parking Spot',
    address: parking?.address || '—',
    rating: 4.5,
    distance: '500m',
    time: parking?.operatingHours || '7:00 am - 11:00 pm',
    about: parking?.description || 'A convenient and secure parking space. Check availability before booking.',
    ownerName: parking?.ownerName || 'ParkEasy',
    ownerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&fit=crop',
    price: `₹${parking?.pricePerHour ?? '—'}`,
    images: (parking?.images?.length > 0) ? parking.images : FALLBACK_IMAGES,
  };

  const handleBookNow = () => {
    if (!parking) return;
    router.push({ pathname: '/(user)/booking', params: { parking: JSON.stringify(parking) } });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <DetailsHeaderCarousel images={details.images} />

        <DetailsInfoSection
          title={details.title}
          address={details.address}
          rating={details.rating}
          distance={details.distance}
          time={details.time}
          about={details.about}
        />

        <OwnerContactCard
          ownerName={details.ownerName}
          ownerAvatar={details.ownerAvatar}
        />

      </ScrollView>

      {/* Floating Bookmark icon */}
      <TouchableOpacity
        style={styles.bookmarkButton}
        onPress={handleToggleBookmark}
        disabled={loadingBookmark}
      >
        <Ionicons
          name={isBookmarked ? "bookmark" : "bookmark-outline"}
          size={24}
          color={COLORS.primary}
        />
      </TouchableOpacity>

      <BottomBookingBar price={details.price} onBookNow={handleBookNow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 120, // Avoid overlap with bottom bar
  },
  bookmarkButton: {
    position: 'absolute',
    top: 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
