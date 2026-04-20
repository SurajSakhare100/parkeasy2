import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomBookingBar({ price, onBookNow, loading = false }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceText}>
            {price}<Text style={styles.priceUnit}></Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, loading && { opacity: 0.7 }]}
          onPress={onBookNow}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.oliveDark} />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={18} color={COLORS.oliveDark} style={{ marginRight: 8 }} />
              <Text style={styles.bookBtnText}>Book Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#FFF',
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    ...SHADOWS.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceContainer: {
    backgroundColor: '#EAE5CD',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 8,
    color: '#8E6F2A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: '#333',
  },
  priceUnit: {
    fontSize: SIZES.small,
    color: '#666',
    fontWeight: 'normal',
  },
  bookBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.light,
  },
  bookBtnText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
});
