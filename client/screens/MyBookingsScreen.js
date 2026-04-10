import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, Platform } from 'react-native';

const activeBookings = [
  {
    id: '1',
    title: 'Meme Parking',
    address: '86th St, Near JN Road, Pune',
    price: '₹10',
    status: 'Now Active',
    image: 'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=200&h=200&fit=crop'
  },
  {
    id: '2',
    title: 'Easy Park',
    address: 'Police Training College, Pune',
    price: '₹10',
    status: 'Starts in 1hr',
    image: 'https://images.unsplash.com/photo-1621245645607-bb561332f7cc?w=200&h=200&fit=crop'
  }
];

const completedBookings = [
  {
    id: '3',
    title: 'Avenue Parking',
    address: '4th Avenue, S\'nagar, Pune',
    price: '₹10',
    status: 'Completed',
    tag: 'Rate us',
    image: 'https://images.unsplash.com/photo-1573347101660-844cd93c2de8?w=200&h=200&fit=crop'
  },
  {
    id: '4',
    title: 'Shri Ganesh Shade',
    address: '10th Av, Shivajinagar, Pune',
    price: '₹10',
    status: 'Completed',
    tag: 'Rate us',
    image: 'https://images.unsplash.com/photo-1604061413812-70b86a3d6023?w=200&h=200&fit=crop'
  }
];

export default function MyBookingsScreen() {
  const [activeTab, setActiveTab] = useState('ACTIVE');

  const bookings = activeTab === 'ACTIVE' ? activeBookings : completedBookings;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Bookings</Text>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, activeTab === 'ACTIVE' && styles.toggleButtonActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.toggleText, activeTab === 'ACTIVE' && styles.toggleTextActive]}>ACTIVE</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, activeTab === 'COMPLETED' && styles.toggleButtonActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.toggleText, activeTab === 'COMPLETED' && styles.toggleTextActive]}>COMPLETED</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {bookings.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardAddress}>{item.address}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{item.price}<Text style={styles.priceUnit}>/hr</Text></Text>
                  
                  {item.status === 'Now Active' && (
                    <View style={styles.statusBadgeActive}>
                      <Text style={styles.statusBadgeActiveText}>{item.status}</Text>
                    </View>
                  )}
                  {item.status === 'Starts in 1hr' && (
                    <View style={styles.statusBadgeOutline}>
                      <Text style={styles.statusBadgeOutlineText}>{item.status}</Text>
                    </View>
                  )}
                  {item.status === 'Completed' && (
                    <>
                      <View style={styles.statusBadgeOutline}>
                        <Text style={styles.statusBadgeOutlineText}>{item.status}</Text>
                      </View>
                      {item.tag && (
                        <View style={styles.statusBadgeRate}>
                          <Text style={styles.statusBadgeRateText}>{item.tag}</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>View Ticket</Text>
              </TouchableOpacity>
              
              {activeTab === 'ACTIVE' ? (
                <TouchableOpacity style={styles.btnSolid}>
                  <Text style={styles.btnSolidText}>View Timer</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.btnSolid}>
                  <Text style={styles.btnSolidText}>Book Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 25 : 0, // safe area padding
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#4C4223', // Matches the dark brown/olive title color
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9E9E9E',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 7,
  },
  toggleButtonActive: {
    backgroundColor: '#FBD427', // Bright yellow
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#4C4223', 
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120, // ample space for the floating bottom nav
  },
  card: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    // slight shadow for floating effect
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#EEE',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#95822E', // Olive price format
    marginRight: 10,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  statusBadgeActive: {
    backgroundColor: '#DECD64',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  statusBadgeOutline: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadgeOutlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  statusBadgeRate: {
    backgroundColor: '#E7DC81',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeRateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6e5e1d',
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F4F4',
    marginBottom: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#9E9E9E',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9E9E9E',
  },
  btnSolid: {
    flex: 1,
    backgroundColor: '#FBD427',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSolidText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4C4223',
  }
});
