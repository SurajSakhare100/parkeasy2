import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const parking = params?.parking ? (typeof params.parking === 'string' ? JSON.parse(params.parking) : params.parking) : null;

  if (!parking) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Parking details not found.</Text>
      </SafeAreaView>
    );
  }

  const [vehicleType, setVehicleType] = useState('car');
  const [selectedHours, setSelectedHours] = useState(params?.selectedDuration ? parseInt(params.selectedDuration) : 1);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom Date Picking Logic
  const today = new Date();
  const next7Days = useMemo(() => {
      const days = [];
      for(let i=0; i<7; i++) {
          const d = new Date();
          d.setDate(today.getDate() + i);
          days.push(d);
      }
      return days;
  }, []);

  const [selectedDate, setSelectedDate] = useState(next7Days[0]);
  const [inputHour, setInputHour] = useState(today.getHours().toString().padStart(2, '0'));
  const [inputMinute, setInputMinute] = useState(today.getMinutes().toString().padStart(2, '0'));

  const startTime = useMemo(() => {
      const start = new Date(selectedDate);
      start.setHours(parseInt(inputHour) || 0, parseInt(inputMinute) || 0, 0, 0);
      return start;
  }, [selectedDate, inputHour, inputMinute]);

  const endTime = new Date(startTime.getTime() + selectedHours * 60 * 60 * 1000);
  const totalAmount = Math.ceil(selectedHours * parking.pricePerHour);

  const handleProceedToPayment = async () => {
    if (startTime < new Date()) {
        Alert.alert("Invalid Time", "Booking time cannot be in the past.");
        return;
    }

    setLoading(true);
    try {
      const result = await bookingService.createBooking({
        parkingId: parking._id,
        vehicleType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      router.push({
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.oliveDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details Selection</Text>
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

        {/* Custom Date Picker */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {next7Days.map((date, idx) => {
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                return (
                    <TouchableOpacity 
                        key={idx} 
                        style={[styles.dateCard, isSelected && styles.dateCardActive]}
                        onPress={() => setSelectedDate(date)}
                    >
                        <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{dayName}</Text>
                        <Text style={[styles.dateText, isSelected && styles.dateTextActive]}>{dayNum}</Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>

        {/* Custom Time Picker */}
        <Text style={styles.sectionTitle}>Select Arrival Time</Text>
        <View style={styles.timePickerContainer}>
            <View style={styles.timeInputGroup}>
                <TextInput 
                    style={styles.timeInput}
                    value={inputHour}
                    onChangeText={(val) => {
                        const n = parseInt(val);
                        if (!val || (n >= 0 && n <= 23)) setInputHour(val);
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput 
                    style={styles.timeInput}
                    value={inputMinute}
                    onChangeText={(val) => {
                        const n = parseInt(val);
                        if (!val || (n >= 0 && n <= 59)) setInputMinute(val);
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                />
            </View>
            <Text style={styles.timeFormatHint}>(24h Format)</Text>
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

        {/* Spot Selection */}
        <Text style={styles.sectionTitle}>Select Parking Spot</Text>
        <View style={styles.chipContainer}>
          {(parking.spots || [])
            .filter(s => s.vehicleType === vehicleType)
            .map((spot, i) => (
            <TouchableOpacity 
              key={i} 
              style={[
                styles.chip, 
                selectedSlot === spot.spotName && styles.chipSelected
              ]}
              onPress={() => setSelectedSlot(spot.spotName)}
            >
              <Text style={[
                styles.chipText,
                selectedSlot === spot.spotName && styles.chipTextSelected
              ]}>{spot.spotName}</Text>
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
            </View>            <View style={styles.timeLine} />
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
              <Text style={styles.timeDate}>{formatDate(endTime)}</Text>
            </View>
          </View>
          <View style={styles.durationHint}>
              <Text style={styles.durationHintText}>Total Duration: {selectedHours} hours</Text>
          </View>
        </View>

        {/* Fare Breakdown */}
        <View style={styles.fareCard}>
          <Text style={styles.fareTitle}>Payment Details</Text>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Parking Fee (₹{parking.pricePerHour} × {selectedHours})</Text>
            <Text style={styles.fareValue}>₹{totalAmount}</Text>
          </View>
          <View style={styles.fareDivider} />
          <View style={styles.fareRow}>
            <Text style={styles.fareTotalLabel}>Subtotal</Text>
            <Text style={styles.fareTotalValue}>₹{totalAmount}</Text>
          </View>

          <View style={styles.policyNotice}>
            <Ionicons name="close-circle" size={16} color="#D32F2F" />
            <Text style={styles.policyText}>Note: Advance bookings are non-refundable.</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.footerAmount}>
          <Text style={styles.footerAmountLabel}>Grand Total</Text>
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
              <Text style={styles.payBtnText}>Confirm Booking</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.oliveDark} style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F2' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: COLORS.oliveDark },
  scrollContent: { padding: 20, paddingBottom: 140 },
  summaryCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 24, ...SHADOWS.light,
  },
  summaryIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0E68C', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  summaryAddress: { fontSize: 12, color: '#666' },
  priceBadge: { backgroundColor: '#FBD427', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  priceBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#4C4223' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.oliveDark, marginBottom: 12, marginTop: 10 },
  vehicleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  vehicleCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', ...SHADOWS.light,
  },
  vehicleCardActive: { borderColor: '#FBD427', backgroundColor: '#FFFDF0' },
  vehicleLabel: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#999' },
  vehicleLabelActive: { color: COLORS.oliveDark },
  vehicleCheck: { position: 'absolute', top: 8, right: 8 },
  
  dateScroll: { marginBottom: 20 },
  dateCard: {
      width: 60, height: 80, backgroundColor: '#FFF', borderRadius: 12, marginRight: 10,
      justifyContent: 'center', alignItems: 'center', ...SHADOWS.light, borderWidth: 1, borderColor: '#EEE'
  },
  dateCardActive: { backgroundColor: '#FBD427', borderColor: '#FBD427' },
  dayText: { fontSize: 12, color: '#999', marginBottom: 4 },
  dayTextActive: { color: '#4C4223', fontWeight: 'bold' },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dateTextActive: { color: '#4C4223' },

  timePickerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  timeInputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 10, ...SHADOWS.light },
  timeInput: { width: 50, height: 50, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#333' },
  timeSeparator: { fontSize: 24, fontWeight: 'bold', color: '#333', marginHorizontal: 4 },
  timeFormatHint: { marginLeft: 15, fontSize: 14, color: '#999' },

  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  durationChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0' },
  durationChipActive: { backgroundColor: '#FBD427', borderColor: '#FBD427' },
  durationChipText: { fontSize: 14, fontWeight: '600', color: '#999' },
  durationChipTextActive: { color: '#4C4223' },

  // Spot Selection
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: {
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#EEE', ...SHADOWS.light,
  },
  chipSelected: { backgroundColor: '#FBD427', borderColor: '#FBD427' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTextSelected: { color: '#4C4223', fontWeight: 'bold' },

  timeSummaryCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 20, marginBottom: 20, ...SHADOWS.light },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeBlock: { alignItems: 'center', flex: 1 },
  timeLabel: { fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase' },
  timeValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  timeDate: { fontSize: 12, color: '#666', marginTop: 2 },
  timeLine: { width: 1, height: 40, backgroundColor: '#EEE' },
  durationHint: { alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10 },
  durationHintText: { fontSize: 13, color: '#4C4223', fontWeight: 'bold' },

  fareCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 20, ...SHADOWS.light },
  fareTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 14 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  fareLabel: { fontSize: 14, color: '#666' },
  fareValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  fareDivider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 10 },
  fareTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  fareTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#4C4223' },
  policyNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', padding: 10, borderRadius: 8, marginTop: 15, gap: 6 },
  policyText: { fontSize: 11, color: '#D32F2F', fontWeight: 'bold' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#EEE',
  },
  footerAmount: { marginRight: 16 },
  footerAmountLabel: { fontSize: 12, color: '#999' },
  footerAmountValue: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  payBtn: {
    flex: 1, backgroundColor: '#FBD427', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 12,
  },
  payBtnText: { fontSize: 16, fontWeight: 'bold', color: '#4C4223' },
});
