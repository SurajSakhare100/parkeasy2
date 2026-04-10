import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../theme';
import FilterModal from '../components/FilterModal';
import { useNavigation } from '@react-navigation/native';

export default function UserHomeScreen() {
  const [filterVisible, setFilterVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Background Map Placeholder */}
      <Image 
        source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&fit=crop' }} 
        style={styles.mapBackgroundImage} 
      />
      
      {/* Semi-transparent overlay to make elements pop */}
      <View style={styles.mapOverlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Section */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <View style={styles.locationIconWrapper}>
              <Ionicons name="location" size={18} color="#A08A38" />
            </View>
            <View>
              <Text style={styles.locationLabel}>Location</Text>
              <Text style={styles.locationText}>Shivajinagar, Pune</Text>
            </View>
            <TouchableOpacity style={styles.bellIcon}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar - Navigate to SearchScreen on Click */}
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

        {/* Map Pins Mockup */}
        <View style={[styles.pin, { top: '30%', left: '20%' }]}>
          <Ionicons name="car" size={16} color={COLORS.oliveDark} />
          <View style={styles.pinPrice}><Text style={styles.pinPriceText}>₹10</Text></View>
        </View>
        <View style={[styles.pin, { top: '50%', right: '30%' }]}>
          <Ionicons name="car" size={16} color={COLORS.oliveDark} />
          <View style={styles.pinPrice}><Text style={styles.pinPriceText}>₹10</Text></View>
        </View>

        {/* Bottom Card Area */}
        <View style={styles.bottomCardContainer}>
          <View style={styles.parkingCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=400&fit=crop' }} 
              style={styles.parkingImage} 
            />
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Meme Parking</Text>
                <Text style={styles.cardAddress}>86th St, Near JN Road, Pune</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color={COLORS.primary} />
                <Text style={styles.ratingText}>4.5</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.priceText}>₹10<Text style={styles.priceUnit}>/hr</Text></Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.bookmarkBtn}>
                  <Ionicons name="bookmark-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('ParkingDetails', { title: 'Meme Parking' })}>
                  <Text style={styles.bookBtnText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

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
  mapBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 35 : 0,
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
    bottom: Platform.OS === 'ios' ? 120 : 100,
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
  }
});
