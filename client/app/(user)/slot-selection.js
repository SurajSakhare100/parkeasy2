import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SHADOWS } from '../../theme';

const VEHICLE_TYPES = [
  { key: 'car', label: 'Car', icon: 'car-sport-outline', description: 'Spacious slots for cars' },
  { key: 'bike', label: 'Bike', icon: 'bicycle-outline', description: 'Compact bike slots' },
];

export default function SlotSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parking = useMemo(() => {
    if (!params?.parking) return null;
    return typeof params.parking === 'string' ? JSON.parse(params.parking) : params.parking;
  }, [params?.parking]);

  const initialType = params?.vehicleType || 'car';
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedSlot, setSelectedSlot] = useState(params?.selectedSlot || null);

  const availableSlots = useMemo(() => {
    if (!parking) return [];
    const spots = (parking.spots || []).filter((spot) => spot.vehicleType === selectedType);
    if (spots.length > 0) {
      return spots;
    }
    return Array.from({ length: 8 }, (_, index) => ({
      spotName: `${selectedType === 'car' ? 'C' : 'B'}${index + 1}`,
      vehicleType: selectedType,
      slotType: 'Regular',
    }));
  }, [parking, selectedType]);

  if (!parking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={COLORS.oliveDark} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const handleConfirmSelection = () => {
    if (!selectedSlot) return;
    router.replace({
      pathname: '/(user)/booking',
      params: {
        parking: JSON.stringify(parking),
        vehicleType: selectedType,
        selectedSlot,
        selectedDuration: params?.selectedDuration || '1',
        startDate: params?.startDate || new Date().toISOString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.oliveDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Slot</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Vehicle Type</Text>
        <View style={styles.typeRow}>
          {VEHICLE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeCard,
                selectedType === type.key && styles.typeCardActive,
              ]}
              onPress={() => {
                setSelectedType(type.key);
                setSelectedSlot(null);
              }}
            >
              <View style={styles.typeIconWrap}>
                <Ionicons
                  name={type.icon}
                  size={32}
                  color={selectedType === type.key ? '#FFF' : COLORS.oliveDark}
                />
              </View>
              <Text style={[styles.typeLabel, selectedType === type.key && styles.typeLabelActive]}>{type.label}</Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Slot type</Text>
          <Text style={styles.noteText}>Each slot is optimized for the selected vehicle type. Pick a specific spot to reserve it.</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Available Slots</Text>
        <View style={styles.slotGrid}>
          {availableSlots.map((slot, index) => (
            <TouchableOpacity
              key={`${slot.spotName}-${index}`}
              style={[
                styles.slotCard,
                selectedSlot === slot.spotName && styles.slotCardActive,
              ]}
              onPress={() => setSelectedSlot(slot.spotName)}
            >
              <View style={styles.slotIconWrap}>
                <Ionicons
                  name={selectedType === 'car' ? 'car' : 'bicycle'}
                  size={18}
                  color={selectedSlot === slot.spotName ? '#FFF' : COLORS.oliveDark}
                />
              </View>
              <Text style={[styles.slotName, selectedSlot === slot.spotName && styles.slotNameActive]}>{slot.spotName}</Text>
              <Text style={styles.slotType}>{slot.slotType ? slot.slotType : selectedType === 'car' ? 'Car Slot' : 'Bike Slot'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Selected slot</Text>
          <Text style={styles.footerValue}>{selectedSlot || 'Pick a slot to continue'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedSlot && styles.confirmButtonDisabled]}
          disabled={!selectedSlot}
          onPress={handleConfirmSelection}
        >
          <Text style={styles.confirmText}>{selectedSlot ? 'Confirm Slot' : 'Select a Slot'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.oliveDark },
  content: { padding: 20, paddingBottom: 140 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.oliveDark, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    ...SHADOWS.light,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: { backgroundColor: COLORS.oliveDark, borderColor: COLORS.oliveDark },
  typeIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  typeLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  typeLabelActive: { color: '#FFF' },
  typeDescription: { fontSize: 12, color: '#777', textAlign: 'center', marginTop: 5 },
  noteCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    ...SHADOWS.light,
  },
  noteTitle: { fontSize: 13, fontWeight: '700', color: COLORS.oliveDark, marginBottom: 6 },
  noteText: { fontSize: 12, color: '#666', lineHeight: 18 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    ...SHADOWS.light,
  },
  slotCardActive: { backgroundColor: COLORS.oliveDark, borderColor: COLORS.oliveDark },
  slotIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotName: { fontSize: 14, fontWeight: '700', color: '#333' },
  slotNameActive: { color: '#FFF' },
  slotType: { fontSize: 11, color: '#777', marginTop: 6 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerLabel: { fontSize: 11, color: '#999' },
  footerValue: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 4 },
  confirmButton: {
    backgroundColor: COLORS.oliveDark,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
