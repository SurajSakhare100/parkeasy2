import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import bookingService from '../../services/bookingService';

const VEHICLE_TYPES = [
  { key: 'car', label: 'Car', icon: 'car-outline' },
  { key: 'bike', label: 'Bike', icon: 'bicycle-outline' },
];

const DURATION_OPTIONS = [
  { label: '1 hr', hours: 1 },
  { label: '2 hrs', hours: 2 },
  { label: '3 hrs', hours: 3 },
  { label: '4 hrs', hours: 4 },
  { label: '6 hrs', hours: 6 },
  { label: '8 hrs', hours: 8 },
  { label: '12 hrs', hours: 12 },
  { label: '24 hrs', hours: 24 },
];

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatDate(date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BookingScreen() {
  const navigation = useRouter();
  const params = useLocalSearchParams();
  
  // Safely parse the parking parameter since it's passed as a JSON string
  const parking = params?.parking ? (typeof params.parking === 'string' ? JSON.parse(params.parking) : params.parking) : null;

  // Early return or fallback if parking is somehow null
  if (!parking) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Parking details not found.</Text>
      </SafeAreaView>
    );
  }

  const [vehicleType, setVehicleType] = useState('car');
  const [selectedHours, setSelectedHours] = useState(1);
  const [loading, setLoading] = useState(false);

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + selectedHours * 60 * 60 * 1000);
  const totalAmount = Math.ceil(selectedHours * parking.pricePerHour);

  const handleProceedToPayment = async () => {
    setLoading(true);
    try {
      const result = await bookingService.createBooking({
        parkingId: parking._id,
        vehicleType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      navigation.push({
        pathname: '/payment',
        params: {
          bookingId: result.bookingId,
          totalAmount: result.totalAmount,
          durationHours: result.durationHours,
          parking: JSON.stringify(parking),
          vehicleType,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }
      });
    } catch (error) {
      Alert.alert('Booking Failed', error.response?.data?.message || 'Could not create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.oliveDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Parking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Parking Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Ionicons name="location" size={20} color={COLORS.oliveDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{parking.name}</Text>
            <Text style={styles.summaryAddress}>{parking.address}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>₹{parking.pricePerHour}/hr</Text>
          </View>
        </View>

        {/* Vehicle Type */}
        <Text style={styles.sectionTitle}>Vehicle Type</Text>
        <View style={styles.vehicleRow}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.vehicleCard, vehicleType === v.key && styles.vehicleCardActive]}
              onPress={() => setVehicleType(v.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={v.icon}
                size={28}
                color={vehicleType === v.key ? COLORS.oliveDark : '#999'}
              />
              <Text style={[styles.vehicleLabel, vehicleType === v.key && styles.vehicleLabelActive]}>
                {v.label}
              </Text>
              {vehicleType === v.key && (
                <View style={styles.vehicleCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.oliveDark} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration Picker */}
        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.hours}
              style={[styles.durationChip, selectedHours === opt.hours && styles.durationChipActive]}
              onPress={() => setSelectedHours(opt.hours)}
              activeOpacity={0.8}
            >
              <Text style={[styles.durationChipText, selectedHours === opt.hours && styles.durationChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Time Summary */}
        <View style={styles.timeSummaryCard}>
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Check In</Text>
              <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
              <Text style={styles.timeDate}>{formatDate(startTime)}</Text>
            </View>
            <View style={styles.timeDivider}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
              <Text style={styles.timeDuration}>{selectedHours}h</Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
              <Text style={styles.timeDate}>{formatDate(endTime)}</Text>
            </View>
          </View>
        </View>

        {/* Fare Breakdown */}
        <View style={styles.fareCard}>
          <Text style={styles.fareTitle}>Fare Breakdown</Text>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Parking Rate</Text>
            <Text style={styles.fareValue}>₹{parking.pricePerHour}/hr</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Duration</Text>
            <Text style={styles.fareValue}>{selectedHours} hr{selectedHours > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.fareDivider} />
          <View style={styles.fareRow}>
            <Text style={styles.fareTotalLabel}>Total Amount</Text>
            <Text style={styles.fareTotalValue}>₹{totalAmount}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <View style={styles.footerAmount}>
          <Text style={styles.footerAmountLabel}>Total</Text>
          <Text style={styles.footerAmountValue}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.7 }]}
          onPress={handleProceedToPayment}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.oliveDark} />
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color={COLORS.oliveDark} style={{ marginRight: 8 }} />
              <Text style={styles.payBtnText}>Proceed to Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.light,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  summaryAddress: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  priceBadge: {
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.olive,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    color: COLORS.oliveDark,
    marginBottom: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.light,
    position: 'relative',
  },
  vehicleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFBEA',
  },
  vehicleLabel: {
    marginTop: 8,
    fontSize: SIZES.font,
    fontWeight: '600',
    color: '#999',
  },
  vehicleLabelActive: {
    color: COLORS.oliveDark,
  },
  vehicleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  durationChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  durationChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationChipText: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: '#999',
  },
  durationChipTextActive: {
    color: COLORS.oliveDark,
  },
  timeSummaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.light,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  timeDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  timeDivider: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  timeDuration: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  fareCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    ...SHADOWS.light,
  },
  fareTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    marginBottom: 14,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fareLabel: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
  },
  fareValue: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: COLORS.text,
  },
  fareDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  fareTotalLabel: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  fareTotalValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.olive,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    ...SHADOWS.medium,
  },
  footerAmount: {
    marginRight: 16,
  },
  footerAmountLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  footerAmountValue: {
    fontSize: SIZES.title,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  payBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  payBtnText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
});
