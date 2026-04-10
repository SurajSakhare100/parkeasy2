import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { COLORS } from '../theme';

import DetailsHeaderCarousel from '../components/DetailsHeaderCarousel';
import DetailsInfoSection from '../components/DetailsInfoSection';
import OwnerContactCard from '../components/OwnerContactCard';
import BottomBookingBar from '../components/BottomBookingBar';

const dummyDetails = {
  title: 'Meme Parking',
  address: '86th St, Near JN Road, Pune',
  rating: 4.5,
  distance: '500m',
  time: '7:00 am - 11:00 pm',
  about: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus.',
  ownerName: 'Xavier',
  ownerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&fit=crop',
  price: '₹10',
  images: [
    'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=800&fit=crop',
    'https://images.unsplash.com/photo-1621245645607-bb561332f7cc?w=800&fit=crop'
  ]
};

export default function ParkingDetailsScreen() {
  const route = useRoute();
  
  // We can pick up the 'title' parameter if passed from Home/Search
  const viewTitle = route.params?.title || dummyDetails.title;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <DetailsHeaderCarousel images={dummyDetails.images} />
        
        <DetailsInfoSection 
          title={viewTitle}
          address={dummyDetails.address}
          rating={dummyDetails.rating}
          distance={dummyDetails.distance}
          time={dummyDetails.time}
          about={dummyDetails.about}
        />

        <OwnerContactCard 
          ownerName={dummyDetails.ownerName}
          ownerAvatar={dummyDetails.ownerAvatar}
        />

      </ScrollView>
      
      <BottomBookingBar price={dummyDetails.price} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20, 
  }
});
