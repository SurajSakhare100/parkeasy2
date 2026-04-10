import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../theme';

export default function BottomBookingBar({ price }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{price}<Text style={styles.priceUnit}>/hr</Text></Text>
        </View>
        <TouchableOpacity style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFF',
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  priceContainer: {
    flex: 1,
    backgroundColor: '#EAE5CD', // light sand background
    paddingVertical: 18,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: '#333',
  },
  priceUnit: {
    fontSize: SIZES.font,
    color: '#666',
    fontWeight: 'normal',
  },
  bookBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: '#4C4223',
  }
});
