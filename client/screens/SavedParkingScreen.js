import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useNavigation } from '@react-navigation/native';

const savedLocations = [
  {
    id: '1',
    name: 'Meme Parking',
    address: '86th St, Near JN Road, Pune',
    image: 'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=200&fit=crop'
  },
  {
    id: '2',
    name: 'Safe Parking',
    address: '16 Avenue, Nr. Jawaharlal Nehru Rd, Pune',
    image: 'https://images.unsplash.com/photo-1621245645607-bb561332f7cc?w=200&fit=crop'
  },
  {
    id: '3',
    name: 'Laxmi Parking Space',
    address: '86th Street, Pune',
    image: 'https://images.unsplash.com/photo-1573347101660-844cd93c2de8?w=200&fit=crop'
  },
  {
    id: '4',
    name: 'Let\'s Park',
    address: '3rd Avenue, Court Rd, Pune',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=200&fit=crop'
  },
  {
    id: '5',
    name: 'Shiv Parking Lot',
    address: '2nd Avenue, Court Rd, Pune',
    image: 'https://images.unsplash.com/photo-1604061413812-70b86a3d6023?w=200&fit=crop'
  }
];

export default function SavedParkingScreen() {
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ParkingDetails', { title: item.name })}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardAddress}>{item.address}</Text>
      </View>
      <View style={styles.bookmarkIcon}>
        <Ionicons name="bookmark" size={24} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.headerTitle}>Saved Parking</Text>
      
      <FlatList
        data={savedLocations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
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
