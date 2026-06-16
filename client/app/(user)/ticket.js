import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, ScrollView, Image, Share, Animated, Alert
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../theme';

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return {
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

export default function TicketScreen() {
  const navigation = useRouter();
  const params = useLocalSearchParams();
  let booking = params.booking;
  if (typeof booking === 'string') {
    try {
      booking = JSON.parse(booking);
    } catch (error) {
      console.warn('Unable to parse booking param:', error);
    }
  }

  const scaleAnim = useRef(new Animated.Value(0)).current;

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.center, { padding: 24 }]}> 
          <Text style={{ fontSize: 16, color: COLORS.textLight, textAlign: 'center' }}>
            Booking details are missing. Please open your ticket from My Bookings again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Success animation sequence
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const start = formatDateTime(booking.startTime);
  const end = formatDateTime(booking.endTime);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🅿️ ParkEasy Ticket\n\n📍 ${booking.parkingName}\n📍 ${booking.address}\n⏰ ${start.date} · ${start.time} → ${end.time}\n💰 ₹${booking.totalAmount}\n\nBooking ID: ${booking.id}`,
      });
    } catch (error) {
      // ignore
    }
  };

  const handleDownloadQR = async () => {
    if (!booking?.qrCodeImage) {
      return Alert.alert('Download unavailable', 'QR code image is not available yet.');
    }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission required', 'Please allow photo library access to save the QR image.');
      }

      const filename = `parkeasy_qr_${booking.id || Date.now()}.png`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(booking.qrCodeImage, fileUri);
      if (downloadResult.status !== 200 && downloadResult.status !== 201) {
        throw new Error('Download failed');
      }

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      try {
        await MediaLibrary.createAlbumAsync('ParkEasy', asset, false);
      } catch (e) {
        // album may already exist — ignore
      }

      Alert.alert('Saved', 'QR code saved to your photos/gallery.');
    } catch (error) {
      // Fallback: try share so user can save manually
      try {
        await Share.share({
          title: 'ParkEasy QR Code',
          message: 'Download or save your parking QR code from here.',
          url: booking.qrCodeImage,
        });
      } catch (err) {
        Alert.alert('Download failed', 'Unable to save or share QR code.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.push('/user-home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.oliveDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Success Animation */}
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark" size={52} color={COLORS.oliveDark} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
          <Text style={styles.successSubtitle}>Your parking slot is reserved</Text>
        </Animated.View>

        {/* E-Ticket */}
        <Animated.View style={[styles.ticket, { opacity: fadeAnim }]}>
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderLeft}>
              <Text style={styles.ticketBrand}>🅿️ ParkEasy</Text>
              <Text style={styles.ticketBookingId}>#{booking.id?.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={[styles.ticketStatusBadge,
            booking.status === 'booked' && styles.ticketStatusBooked,
            ]}>
              <Text style={styles.ticketStatusText}>
                {booking.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Tear Line */}
          <View style={styles.tearLine}>
            <View style={styles.tearCircleLeft} />
            <View style={styles.tearDashes} />
            <View style={styles.tearCircleRight} />
          </View>

          {/* Parking Info */}
          <View style={styles.ticketSection}>
            <View style={styles.ticketRow}>
              <Ionicons name="location" size={16} color={COLORS.olive} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.ticketLabel}>Location</Text>
                <Text style={styles.ticketValue}>{booking.parkingName}</Text>
                <Text style={styles.ticketSub}>{booking.address}</Text>
              </View>
            </View>
          </View>

          {/* Time Slots */}
          <View style={styles.timeGrid}>
            <View style={styles.timeGridItem}>
              <Text style={styles.timeGridLabel}>Check In</Text>
              <Text style={styles.timeGridTime}>{start.time}</Text>
              <Text style={styles.timeGridDate}>{start.date}</Text>
            </View>
            <View style={styles.timeGridArrow}>
              <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.timeGridItem}>
              <Text style={styles.timeGridLabel}>Check Out</Text>
              <Text style={styles.timeGridTime}>{end.time}</Text>
              <Text style={styles.timeGridDate}>{end.date}</Text>
            </View>
          </View>

          {/* Vehicle, Spot & Amount */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>
                {booking.vehicleType === 'car' ? '🚗 Car' : '🏍️ Bike'}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Spot No.</Text>
              <Text style={[styles.detailValue, { color: COLORS.olive }]}>{booking.spotName || '—'}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[styles.detailValue]}>₹{booking.totalAmount}</Text>
            </View>
          </View>

          {/* Tear Line */}
          <View style={styles.tearLine}>
            <View style={styles.tearCircleLeft} />
            <View style={styles.tearDashes} />
            <View style={styles.tearCircleRight} />
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Scan at Entry Gate</Text>
            {booking.qrCodeImage ? (
              <Image
                source={{ uri: booking.qrCodeImage }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrFallback}>
                <Text style={styles.qrFallbackText}>{booking.qrCode}</Text>
                <Text style={styles.qrHint}>Show this code at the parking gate</Text>
              </View>
            )}
            <Text style={styles.qrNote}>Valid for this booking only</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={18} color={COLORS.oliveDark} />
            <Text style={styles.shareBtnText}>Share Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareBtn, { borderColor: COLORS.olive, backgroundColor: '#F0FFF0' }]} onPress={handleDownloadQR} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={18} color={COLORS.oliveDark} />
            <Text style={[styles.shareBtnText, { color: COLORS.oliveDark }]}>Download QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSolid}
            onPress={() => navigation.push('/user-home')}
            activeOpacity={0.8}
          >
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* View Bookings Link */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', marginBottom: 40 }}>
          <TouchableOpacity onPress={() => navigation.push('/my-bookings')}>
            <Text style={styles.viewAllText}>View All Bookings</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
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
    padding: 24,
    alignItems: 'center',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  successTitle: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 28,
  },
  ticket: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
    marginBottom: 24,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.oliveDark,
  },
  ticketHeaderLeft: {},
  ticketBrand: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  ticketBookingId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  ticketStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  ticketStatusBooked: {
    backgroundColor: COLORS.primary,
  },
  ticketStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    letterSpacing: 1,
  },
  tearLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  tearCircleLeft: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F8F7F2',
    marginLeft: -11,
  },
  tearCircleRight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F8F7F2',
    marginRight: -11,
  },
  tearDashes: {
    flex: 1,
    height: 1.5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  ticketSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ticketLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ticketValue: {
    fontSize: SIZES.font,
    fontWeight: '700',
    color: COLORS.text,
  },
  ticketSub: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FAFAF7',
  },
  timeGridItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeGridArrow: {
    paddingHorizontal: 8,
  },
  timeGridLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeGridTime: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  timeGridDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  qrSection: {
    alignItems: 'center',
    padding: 24,
  },
  qrTitle: {
    fontSize: SIZES.font,
    fontWeight: '700',
    color: COLORS.oliveDark,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qrImage: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  qrFallback: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.badgeBg,
  },
  qrFallbackText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    textAlign: 'center',
    letterSpacing: 1,
  },
  qrHint: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
  },
  qrNote: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#FFF',
    gap: 6,
  },
  shareBtnText: {
    fontSize: SIZES.font,
    fontWeight: '700',
    color: COLORS.oliveDark,
  },
  homeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  homeBtnText: {
    fontSize: SIZES.font,
    fontWeight: '700',
    color: COLORS.oliveDark,
  },
  viewAllBookings: {
    fontSize: SIZES.font,
    color: COLORS.olive,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
