import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../theme';

export default function DetailsInfoSection({ 
  title, address, rating, time, about, 
  spots = [], vehicleTypes = [], amenities = []
}) {
  const [expanded, setExpanded] = useState(false);

  // Count spots per vehicle type
  const carSpots = spots.filter(s => s.vehicleType === 'car');
  const bikeSpots = spots.filter(s => s.vehicleType === 'bike');

  // Truncate description
  const CHAR_LIMIT = 120;
  const isLong = about && about.length > CHAR_LIMIT;
  const displayText = isLong && !expanded ? about.substring(0, CHAR_LIMIT) + '...' : about;

  return (
    <View style={styles.container}>

      {/* ── Title & Rating ── */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color="#A0A0A0" />
            <Text style={styles.address}>{address}</Text>
          </View>
        </View>
        <View style={styles.ratingBox}>
          <Ionicons name="star" size={18} color={COLORS.primary} />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>

      {/* ── Highlights: Operating Hours ── */}
      <View style={styles.highlightRow}>
        <View style={styles.highlightCard}>
          <Ionicons name="time-outline" size={18} color="#4C4223" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.highlightLabel}>Hours</Text>
            <Text style={styles.highlightValue}>{time}</Text>
          </View>
        </View>
        <View style={[styles.highlightCard, { marginLeft: 10 }]}>
          <Ionicons name="car-outline" size={18} color="#4C4223" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.highlightLabel}>Accepts</Text>
            <Text style={styles.highlightValue}>
              {vehicleTypes.length > 0 ? vehicleTypes.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(' & ') : 'Car & Bike'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Spot Breakdown ── */}
      {spots.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parking Spots</Text>
          <View style={styles.spotsRow}>
            {carSpots.length > 0 && (
              <View style={styles.spotTypeBadge}>
                <Ionicons name="car" size={16} color="#4C4223" />
                <Text style={styles.spotTypeCount}>{carSpots.length}</Text>
                <Text style={styles.spotTypeLabel}>Car Spots</Text>
              </View>
            )}
            {bikeSpots.length > 0 && (
              <View style={[styles.spotTypeBadge, { marginLeft: 10 }]}>
                <Ionicons name="bicycle" size={16} color="#4C4223" />
                <Text style={styles.spotTypeCount}>{bikeSpots.length}</Text>
                <Text style={styles.spotTypeLabel}>Bike Spots</Text>
              </View>
            )}
          </View>

          {/* Spot name info (non-selectable here) */}
          <View style={styles.chipContainer}>
            {spots.map((spot, i) => (
              <View 
                key={i} 
                style={[
                  styles.chip, 
                  spot.vehicleType === 'bike' && styles.chipBike
                ]}
              >
                <Text style={styles.chipText}>{spot.spotName}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── About / Description ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>{displayText || 'No description provided.'}</Text>
        {isLong && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.readMore}>{expanded ? 'Show Less' : 'Read More'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Amenities ── */}
      {amenities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {amenities.map((item, idx) => {
              let icon = 'shield-checkmark-outline';
              if (item.toLowerCase().includes('cctv')) icon = 'videocam-outline';
              if (item.toLowerCase().includes('security')) icon = 'eye-outline';
              if (item.toLowerCase().includes('lighting')) icon = 'bulb-outline';
              if (item.toLowerCase().includes('covered')) icon = 'umbrella-outline';
              
              return (
                <View key={idx} style={styles.amenityItem}>
                  <View style={styles.amenityIconBg}>
                    <Ionicons name={icon} size={18} color="#4C4223" />
                  </View>
                  <Text style={styles.amenityText}>{item}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#4C4223',
    marginBottom: 4,
    flexShrink: 1,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { fontSize: 12, color: '#A0A0A0', flex: 1 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 8 },
  ratingText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  // Highlights
  highlightRow: { flexDirection: 'row', marginBottom: 16 },
  highlightCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3EDCD', borderRadius: 10, padding: 10,
  },
  highlightLabel: { fontSize: 10, color: '#888', marginBottom: 1 },
  highlightValue: { fontSize: 12, fontWeight: '700', color: '#4C4223' },

  // Spots
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  spotsRow: { flexDirection: 'row', marginBottom: 12 },
  spotTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FBD427', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  spotTypeCount: { fontSize: 15, fontWeight: 'bold', color: '#4C4223' },
  spotTypeLabel: { fontSize: 12, color: '#4C4223', fontWeight: '600' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: '#EAF3FF', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#C8DFF8',
  },
  chipBike: { backgroundColor: '#F0FFF4', borderColor: '#A8E6B8' },
  chipText: { fontSize: 11, color: '#444', fontWeight: '600' },

  // About
  aboutText: { fontSize: 13, color: '#666', lineHeight: 20 },
  readMore: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold', marginTop: 4 },

  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '45%', // roughly 2 columns
    marginBottom: 4,
  },
  amenityIconBg: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F3EDCD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
