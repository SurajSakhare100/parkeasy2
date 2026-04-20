import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import parkingService from '../../services/parkingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditParkingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Core Data State
  const [parkingData, setParkingData] = useState(null);

  // States mirroring add-parking.js
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [totalSlots, setTotalSlots] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Vehicle types toggle
  const [hasCar, setHasCar] = useState(true);
  const [hasBike, setHasBike] = useState(true);

  // Separate spot range inputs (mirroring add-parking implementation if needed)
  // For Edit, we might keep existing spots or allow re-parsing
  const [carSpotRange, setCarSpotRange] = useState('');
  const [bikeSpotRange, setBikeSpotRange] = useState('');

  // Operating hours
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');

  // Images
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const AMENITY_OPTIONS = [
    'CCTV Surveillance', '24/7 Security', 'Well Lit', 'Covered Parking', 'Electric Charging', 'Car Wash'
  ];

  const toggleAmenity = (name) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  // Sync state when parking data arrives
  useEffect(() => {
    if (params?.parking) {
        try {
            const p = typeof params.parking === 'string' ? JSON.parse(params.parking) : params.parking;
            if (p) {
                setParkingData(p);
                setName(p.name || '');
                setAddress(p.address || '');
                setDescription(p.description || '');
                setPricePerHour(p.pricePerHour?.toString() || '');
                setTotalSlots(p.totalSlots?.toString() || '');
                setLatitude(p.location?.coordinates?.[1]?.toString() || '');
                setLongitude(p.location?.coordinates?.[0]?.toString() || '');
                setHasCar(p.vehicleType?.includes('car'));
                setHasBike(p.vehicleType?.includes('bike'));
                setStartTime(p.startTime || '08:00');
                setEndTime(p.endTime || '22:00');
                setSelectedAmenities(p.amenities || []);
                
                if (p.images && Array.isArray(p.images)) {
                    setImages(p.images.map(url => ({ uri: url, isRemote: true })));
                }
            }
        } catch (e) {
            console.error("Failed to parse parking data", e);
        }
    }
  }, [params?.parking]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to pick images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - images.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));

  const uploadImagesToServer = async (imageAssets) => {
    if (imageAssets.length === 0) return [];
    
    const formData = new FormData();
    imageAssets.forEach((img, index) => {
      // In Expo SDK 50+, the property is 'mimeType'. Fallback to 'type' or image/jpeg
      const type = img.mimeType || img.type || 'image/jpeg';
      const name = img.fileName || `parking_edit_${index}.jpg`;
      
      formData.append('images', {
        uri: img.uri,
        type: type,
        name: name,
      });
    });

    const token = await AsyncStorage.getItem('userToken');
    const baseURL = process.env.EXPO_PUBLIC_API_URL;

    const response = await fetch(`${baseURL}/upload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('SERVER UPLOAD ERROR:', errData);
        throw new Error(errData.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.urls;
  };

  // ─── Spot Range Parser (Same as add-parking.js) ───────────────────
  const parseRange = (rangeStr, vehicleType) => {
    const spots = [];
    if (!rangeStr) return [];
    const parts = rangeStr.split(',');
    parts.forEach(part => {
      const trimmed = part.trim();
      const dashIdx = trimmed.search(/-(?=[^-]*$)/);  // last dash
      if (dashIdx === -1) {
        if (trimmed) spots.push({ spotName: trimmed, vehicleType });
      } else {
        const startPart = trimmed.substring(0, dashIdx);
        const endPart = trimmed.substring(dashIdx + 1);
        const prefix = startPart.match(/^[a-zA-Z]*/)?.[0] || '';
        const startNum = parseInt(startPart.replace(prefix, ''));
        const endNum = parseInt(endPart.replace(prefix, ''));
        if (!isNaN(startNum) && !isNaN(endNum)) {
          const min = Math.min(startNum, endNum);
          const max = Math.max(startNum, endNum);
          for (let i = min; i <= max; i++) {
            spots.push({ spotName: `${prefix}${i}`, vehicleType });
          }
        }
      }
    });
    return spots;
  };

  const handleUpdate = async () => {
    if (!name.trim() || !address.trim() || !pricePerHour || !totalSlots || !latitude || !longitude) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }

    if (images.length < 4) {
      Alert.alert('Images Required', 'Please ensure there are at least 4 parking images.');
      return;
    }

    setLoading(true);
    try {
      const existingUrls = images.filter(img => img.isRemote).map(img => img.uri);
      const newImages = images.filter(img => !img.isRemote);

      let newUrls = [];
      if (newImages.length > 0) {
        newUrls = await uploadImagesToServer(newImages);
      }

      const finalImages = [...existingUrls, ...newUrls];

      const vehicleTypeArr = [];
      if (hasCar) vehicleTypeArr.push('car');
      if (hasBike) vehicleTypeArr.push('bike');

      // Re-parse spots if range is provided, otherwise keep existing
      let finalSpots = parkingData.spots;
      if (carSpotRange.trim() || bikeSpotRange.trim()) {
        const newParsedSpots = [];
        if (hasCar && carSpotRange.trim()) newParsedSpots.push(...parseRange(carSpotRange, 'car'));
        if (hasBike && bikeSpotRange.trim()) newParsedSpots.push(...parseRange(bikeSpotRange, 'bike'));
        
        if (newParsedSpots.length > 0) {
            finalSpots = newParsedSpots;
        }
      }

      await parkingService.updateParking(parkingData._id, {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        pricePerHour: Number(pricePerHour),
        totalSlots: Number(totalSlots),
        availableSlots: Number(totalSlots), 
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        vehicleType: vehicleTypeArr,
        startTime,
        endTime,
        images: finalImages,
        amenities: selectedAmenities,
        spots: finalSpots
      });

      Alert.alert('Success! 🎉', 'Parking details updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Update error', error);
      Alert.alert('Error', 'Could not update parking. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!parkingData) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FBD427" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading details...</Text>
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#4C4223" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Parking Spot</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>

        {/* ── IMAGES ── */}
        <SectionHeader title="📷 Parking Images" subtitle="Add or remove photos of your parking" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
            <Ionicons name="camera-outline" size={28} color="#888" />
            <Text style={styles.addImageText}>Add Photos</Text>
          </TouchableOpacity>
          {images.map((img, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: img.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(index)}>
                <Ionicons name="close-circle" size={22} color="#E53935" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.helperText}>{images.length} / 10 images selected</Text>

        {/* ── BASIC INFO ── */}
        <SectionHeader title="📍 Basic Information" />

        <InputField label="Parking Name *" value={name} onChangeText={setName} placeholder="e.g. City Mall Parking" />
        <InputField label="Address *" value={address} onChangeText={setAddress} placeholder="Full address" multiline />
        <InputField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe features, security, etc."
          multiline
          numberOfLines={3}
        />

        {/* ── PRICING & SLOTS ── */}
        <SectionHeader title="💰 Pricing & Capacity" />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <InputField label="Rate (₹/hour) *" value={pricePerHour} onChangeText={setPricePerHour} placeholder="50" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Total Slots *" value={totalSlots} onChangeText={setTotalSlots} placeholder="100" keyboardType="numeric" />
          </View>
        </View>

        {/* ── VEHICLE TYPES ── */}
        <SectionHeader title="🚗 Vehicle Types Supported" />
        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Ionicons name="car" size={20} color={hasCar ? '#4C4223' : '#BBB'} />
            <Text style={[styles.toggleLabel, !hasCar && { color: '#BBB' }]}>Cars</Text>
            <Switch
              value={hasCar}
              onValueChange={setHasCar}
              trackColor={{ false: '#DDD', true: '#FBD427' }}
              thumbColor={hasCar ? '#4C4223' : '#FFF'}
            />
          </View>
          <View style={styles.toggleItem}>
            <Ionicons name="bicycle" size={20} color={hasBike ? '#4C4223' : '#BBB'} />
            <Text style={[styles.toggleLabel, !hasBike && { color: '#BBB' }]}>Bikes</Text>
            <Switch
              value={hasBike}
              onValueChange={setHasBike}
              trackColor={{ false: '#DDD', true: '#FBD427' }}
              thumbColor={hasBike ? '#4C4223' : '#FFF'}
            />
          </View>
        </View>

        {/* ── SPOT DETAILS ── */}
        <SectionHeader title="🅿️ Spot Details" subtitle="Update spot names (leave blank to keep existing)" />

        {hasCar && (
          <View style={styles.spotCard}>
            <View style={styles.spotCardHeader}>
              <Ionicons name="car" size={18} color="#4C4223" />
              <Text style={styles.spotCardTitle}>Car Spots</Text>
            </View>
            <InputField
              label="New Spot Range"
              value={carSpotRange}
              onChangeText={setCarSpotRange}
              placeholder="e.g. C1-C20 or C1,C2,C3"
            />
            <Text style={styles.helperText}>Use range (C1-C20) or comma-separated (C1,C2,C3)</Text>
          </View>
        )}

        {hasBike && (
          <View style={styles.spotCard}>
            <View style={styles.spotCardHeader}>
              <Ionicons name="bicycle" size={18} color="#4C4223" />
              <Text style={styles.spotCardTitle}>Bike Spots</Text>
            </View>
            <InputField
              label="New Spot Range"
              value={bikeSpotRange}
              onChangeText={setBikeSpotRange}
              placeholder="e.g. B1-B30 or B1,B2,B3"
            />
            <Text style={styles.helperText}>Use range (B1-B30) or comma-separated (B1,B2,B3)</Text>
          </View>
        )}

        {/* ── OPERATING HOURS ── */}
        <SectionHeader title="🕐 Operating Hours" subtitle="24-hour format (HH:MM)" />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <InputField label="Opens At *" value={startTime} onChangeText={setStartTime} placeholder="08:00" keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Closes At *" value={endTime} onChangeText={setEndTime} placeholder="22:00" keyboardType="numbers-and-punctuation" />
          </View>
        </View>

        {/* ── AMENITIES ── */}
        <SectionHeader title="✨ Amenities" subtitle="Select features available at your parking" />
        <View style={styles.amenitiesContainer}>
          {AMENITY_OPTIONS.map((item) => (
            <TouchableOpacity 
              key={item} 
              style={[
                styles.amenityChip, 
                selectedAmenities.includes(item) && styles.amenityChipActive
              ]}
              onPress={() => toggleAmenity(item)}
            >
              <Ionicons 
                name={selectedAmenities.includes(item) ? "checkmark" : "add"} 
                size={16} 
                color={selectedAmenities.includes(item) ? "#4C4223" : "#888"} 
              />
              <Text style={[
                styles.amenityChipText,
                selectedAmenities.includes(item) && styles.amenityChipTextActive
              ]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── LOCATION ── */}
        <SectionHeader title="🗺️ Location Coordinates" subtitle="Find your lat/lng via Google Maps" />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <InputField label="Latitude *" value={latitude} onChangeText={setLatitude} placeholder="28.6139" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Longitude *" value={longitude} onChangeText={setLongitude} placeholder="77.2090" keyboardType="decimal-pad" />
          </View>
        </View>

        {/* ── SUBMIT ── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#4C4223" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#4C4223" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Update Parking Spot</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Reusable Sub-components ───────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function InputField({ label, multiline, numberOfLines, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: (numberOfLines || 2) * 40, textAlignVertical: 'top' }]}
        placeholderTextColor="#BBB"
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F2' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 18, fontWeight: 'bold', color: '#4C4223' },
  formContent: { padding: 20, paddingBottom: 50 },

  sectionHeader: { marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#4C4223' },
  sectionSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },

  imageScroll: { marginBottom: 8 },
  addImageBtn: {
    width: 90, height: 90, backgroundColor: '#FFF', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#CCC',
  },
  addImageText: { fontSize: 11, color: '#888', marginTop: 4 },
  imageWrapper: { position: 'relative', marginRight: 10 },
  previewImage: { width: 90, height: 90, borderRadius: 12 },
  removeImage: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 12 },

  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  helperText: { fontSize: 11, color: '#AAA', marginTop: 4 },
  input: {
    backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0', color: '#333',
  },

  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  toggleItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#EEE',
  },
  toggleLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#4C4223' },

  submitBtn: {
    backgroundColor: '#FBD427', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 28, marginBottom: 20,
  },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#4C4223' },

  spotCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 12,
  },
  spotCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  spotCardTitle: { fontSize: 14, fontWeight: '700', color: '#4C4223' },

  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  amenityChipActive: {
    backgroundColor: '#FBD427',
    borderColor: '#FBD427',
  },
  amenityChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  amenityChipTextActive: {
    color: '#4C4223',
    fontWeight: '700',
  },
});
