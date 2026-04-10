import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../theme';

export default function DetailsInfoSection({ title, address, rating, distance, time, about }) {
  return (
    <View style={styles.container}>
      {/* Title & Rating Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.address}>{address}</Text>
        </View>
        <View style={styles.ratingBox}>
          <Ionicons name="star" size={26} color={COLORS.primary} />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>

      {/* Highlights Box */}
      <View style={styles.highlightsRow}>
        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="car" size={16} color={COLORS.oliveDark} />
            </View>
            <Text style={styles.infoText}>{distance}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={COLORS.oliveDark} style={{ marginRight: 6 }}/>
            <Text style={styles.infoText}>{time}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.bookmarkIcon}>
          <Ionicons name="bookmark-outline" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.aboutContainer}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          {about}
          <Text style={styles.readMore}> Read More...</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: '#4C4223',
    marginBottom: 6,
  },
  address: {
    fontSize: SIZES.medium,
    color: '#A0A0A0',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 6,
  },
  highlightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBox: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F3EDCD', // Light yellow box from UI
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginRight: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DECD64',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  infoText: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: '#4C4223',
  },
  bookmarkIcon: {
    padding: 5,
  },
  aboutContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: SIZES.title,
    fontWeight: 'bold',
    color: '#4C4223',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: SIZES.font,
    color: '#A0A0A0',
    lineHeight: 22,
  },
  readMore: {
    color: COLORS.primary,
    fontWeight: 'bold',
  }
});
