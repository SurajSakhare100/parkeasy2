import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  
  const parking = useMemo(() => {
    if (!params?.parking) return null;
    return typeof params.parking === 'string'
      ? JSON.parse(params.parking)
      : params.parking;
  }, [params?.parking]);

  if (!parking) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Parking details not found.</Text>
      </SafeAreaView>
    );
  }

  const [vehicleType, setVehicleType] = useState(params?.vehicleType || 'car');
  const [selectedHours, setSelectedHours] = useState(params?.selectedDuration ? parseInt(params.selectedDuration, 10) : 1);
  const [selectedSlot, setSelectedSlot] = useState(params?.selectedSlot || null);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(
    params?.startDate ? new Date(params.startDate) : new Date()
  );

  useEffect(() => {
    if (params?.vehicleType) setVehicleType(params.vehicleType);
    if (params?.selectedSlot) setSelectedSlot(params.selectedSlot);
    if (params?.selectedDuration) setSelectedHours(parseInt(params.selectedDuration, 10));
    if (params?.startDate) {
      const parsed = new Date(params.startDate);
      if (!Number.isNaN(parsed.getTime())) {
        setStartDate(parsed);
      }
    }
  }, [params?.vehicleType, params?.selectedSlot, params?.selectedDuration, params?.startDate]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const startTime = startDate;
  const endTime = new Date(startTime.getTime() + selectedHours * 60 * 60 * 1000);
  const totalAmount = Math.ceil(selectedHours * parking.pricePerHour);

  const onDateChange = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      const newDate = new Date(startDate);
      newDate.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStartDate(newDate);
    }
  };

  const onTimeChange = (event, selected) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) {
      const newDate = new Date(startDate);
      newDate.setHours(selected.getHours(), selected.getMinutes());
      setStartDate(newDate);
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedSlot) {
      Alert.alert("Select a Spot", "Please select a specific parking spot to continue.");
      return;
    }
    if (startTime < new Date()) {
        Alert.alert("Invalid Time", "Booking time cannot be in the past.");
        return;
    }

    setLoading(true);
    try {
      const result = await bookingService.createBooking({
        parkingId: parking._id,
        vehicleType,
        spotName: selectedSlot,
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
          spotName: selectedSlot,
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

        {/* ── PARKING INFO ── */}
        <View style={styles.summaryCard}>
          <Ionicons name="location" size={20} color={COLORS.oliveDark} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle} numberOfLines={1}>{parking.name}</Text>
            <Text style={styles.summaryAddress} numberOfLines={1}>{parking.address}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>₹{parking.pricePerHour}/hr</Text>
          </View>
        </View>

        {/* ── VEHICLE TYPE ── */}
        <SectionHeader title="Vehicle Type" />
        <View style={styles.vehicleRow}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.vehicleCard, vehicleType === v.key && styles.vehicleCardActive]}
              onPress={() => {
                  setVehicleType(v.key);
                  setSelectedSlot(null);
              }}
            >
              <Ionicons name={v.icon} size={28} color={vehicleType === v.key ? COLORS.oliveDark : '#999'} />
              <Text style={[styles.vehicleLabel, vehicleType === v.key && styles.vehicleLabelActive]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── DATE & TIME PICKER ── */}
        <SectionHeader title="Select Schedule" />
        <View style={styles.dateTimeContainer}>
           <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <View style={styles.pickerTextWrap}>
                  <Text style={styles.pickerLabel}>Date</Text>
                  <Text style={styles.pickerValue}>{formatDate(startDate)}</Text>
              </View>
           </TouchableOpacity>

           <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <View style={styles.pickerTextWrap}>
                  <Text style={styles.pickerLabel}>Arrival</Text>
                  <Text style={styles.pickerValue}>{formatTime(startDate)}</Text>
              </View>
           </TouchableOpacity>
        </View>

        {showDatePicker && (
            <DateTimePicker
                value={startDate}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={onDateChange}
            />
        )}
        {showTimePicker && (
            <DateTimePicker
                value={startDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                onChange={onTimeChange}
            />
        )}

        {/* ── DURATION ── */}
        <SectionHeader title="Duration" />
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.hours}
              style={[styles.durationChip, selectedHours === opt.hours && styles.durationChipActive]}
              onPress={() => setSelectedHours(opt.hours)}
            >
              <Text style={[styles.durationChipText, selectedHours === opt.hours && styles.durationChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SLOT SELECTION NAVIGATION ── */}
        <SectionHeader title="Slot Selection" subtitle="Choose your vehicle type and select a spot separately" />
        <View style={styles.slotSummaryCard}>
          <View style={styles.slotSummaryLeft}>
            <Text style={styles.slotSummaryLabel}>Selected vehicle</Text>
            <Text style={styles.slotSummaryValue}>{vehicleType === 'car' ? 'Car' : 'Bike'}</Text>
            <Text style={styles.slotSummaryLabel}>Chosen slot</Text>
            <Text style={styles.slotSummaryValue}>{selectedSlot || 'No slot selected yet'}</Text>
          </View>
          <TouchableOpacity
            style={styles.chooseSlotButton}
            onPress={() => router.push({
              pathname: '/(user)/slot-selection',
              params: {
                parking: JSON.stringify(parking),
                vehicleType,
                selectedDuration: selectedHours.toString(),
                startDate: startDate.toISOString(),
                selectedSlot,
              }
            })}
          >
            <Text style={styles.chooseSlotText}>{selectedSlot ? 'Change Slot' : 'Choose Slot'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── FARE SUMMARY ── */}
        <View style={styles.fareCard}>
           <Text style={styles.fareTitle}>Booking Summary</Text>
           <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Arrival</Text>
              <Text style={styles.fareValueText}>{formatTime(startTime)}, {formatDate(startDate)}</Text>
           </View>
           <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Total Hours</Text>
              <Text style={styles.fareValueText}>{selectedHours} hours</Text>
           </View>
           <View style={styles.fareDivider} />
           <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Selected Spot</Text>
              <Text style={[styles.fareValueText, { color: COLORS.oliveDark, fontWeight: 'bold' }]}>{selectedSlot || 'Not Chosen'}</Text>
           </View>
        </View>

        <View style={styles.policyNotice}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.policyText}>Note: Spot reservation depends on availability at arrival.</Text>
        </View>

      </ScrollView>

      {/* ── FOOTER ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View>
          <Text style={styles.footerLabel}>Grand Total</Text>
          <Text style={styles.footerValue}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, (!selectedSlot || loading) && { opacity: 0.6 }]}
          onPress={handleProceedToPayment}
          disabled={loading || !selectedSlot}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.oliveDark} />
          ) : (
            <Text style={styles.payBtnText}>
                {selectedSlot ? `Confirm ${selectedSlot}` : 'Pick a Spot'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SectionHeader({ title, subtitle }) {
    return (
        <View style={{ marginBottom: 12, marginTop: 15 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
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
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, ...SHADOWS.light,
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  summaryAddress: { fontSize: 12, color: '#666', marginTop: 2 },
  priceBadge: { backgroundColor: '#FBD427', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  priceBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#4C4223' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.oliveDark },
  sectionSubtitle: { fontSize: 11, color: '#999', marginTop: 2 },

  vehicleRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  vehicleCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', ...SHADOWS.light,
  },
  vehicleCardActive: { borderColor: '#FBD427', backgroundColor: '#FFFDF0' },
  vehicleLabel: { marginTop: 6, fontSize: 13, fontWeight: '600', color: '#999' },
  vehicleLabelActive: { color: COLORS.oliveDark },

  dateTimeContainer: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  pickerBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, ...SHADOWS.light, gap: 10
  },
  pickerLabel: { fontSize: 11, color: '#999' },
  pickerValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  durationChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE' },
  durationChipActive: { backgroundColor: '#FBD427', borderColor: '#FBD427' },
  durationChipText: { fontSize: 13, color: '#999', fontWeight: '600' },
  durationChipTextActive: { color: '#4C4223' },

  slotSummaryCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 20, ...SHADOWS.light,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  slotSummaryLeft: { flex: 1, marginRight: 10 },
  slotSummaryLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  slotSummaryValue: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  chooseSlotButton: {
    backgroundColor: COLORS.oliveDark, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center'
  },
  chooseSlotText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  fareCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, ...SHADOWS.light },
  fareTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fareLabel: { fontSize: 13, color: '#666' },
  fareValueText: { fontSize: 13, fontWeight: '600', color: '#333' },
  fareDivider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 8 },

  policyNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 6, paddingHorizontal: 4 },
  policyText: { fontSize: 11, color: '#888' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#EEE', 
    justifyContent: 'space-between'
  },
  footerLabel: { fontSize: 11, color: '#999' },
  footerValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  payBtn: {
    backgroundColor: '#FBD427', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, minWidth: 160, alignItems: 'center'
  },
  payBtnText: { fontSize: 15, fontWeight: 'bold', color: '#4C4223' },
});
