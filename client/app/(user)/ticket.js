import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, ScrollView, Image, Share, Animated, Alert
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import bookingService from '../../services/bookingService';
import { useTheme } from '../../context/ThemeContext';

function formatDateTime(isoString) {
  if (!isoString) return { time: '—', date: '—' };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { time: '—', date: '—' };
  return {
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

export default function TicketScreen() {
  const navigation = useRouter();
  const { theme, isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  const [booking, setBooking] = useState(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize booking details from parameters
  useEffect(() => {
    let initialBooking = params.booking;
    if (typeof initialBooking === 'string') {
      try {
        const parsed = JSON.parse(initialBooking);
        setBooking(parsed);
      } catch (error) {
        console.warn('Unable to parse booking param:', error);
      }
    }
  }, [params.booking]);

  // Fetch the latest booking status from backend to handle real-time check-in updates
  useEffect(() => {
    const bookingId = booking?.id || booking?._id;
    if (!bookingId) return;

    let active = true;
    const fetchLatest = async () => {
      try {
        const latest = await bookingService.getBookingById(bookingId);
        if (active) {
          setBooking(latest);
        }
      } catch (err) {
        console.warn('Failed to fetch latest booking:', err);
      }
    };
    
    fetchLatest();
    
    // Poll every 8 seconds to reflect gate entry/exit changes automatically
    const interval = setInterval(fetchLatest, 8000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [booking?.id, booking?._id]);

  useEffect(() => {
    if (booking) {
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
    }
  }, [!!booking]);

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.center, { padding: 24 }]}> 
          <Text style={{ fontSize: 16, color: theme.textLight, textAlign: 'center' }}>
            Booking details are missing. Please open your ticket from My Bookings again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const bookingIdStr = booking.id || booking._id;
  const parkingName = booking.parkingName || booking.parkingId?.name || 'N/A';
  const address = booking.address || booking.parkingId?.address || '—';
  const spotName = booking.spotName || '—';
  
  const start = formatDateTime(booking.startTime);
  const end = formatDateTime(booking.endTime);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🅿️ ParkEasy Ticket\n\n📍 ${parkingName}\n📍 ${address}\n🚗 ${booking.vehicleNumber || 'Vehicle'}\n⏰ ${start.date} · ${start.time} → ${end.time}\n💰 ₹${booking.totalAmount}\n\nBooking ID: ${bookingIdStr}`,
      });
    } catch (error) {
      // ignore
    }
  };

  const handleDownloadQR = async () => {
    if (!booking?.qrCodeImage) {
      return Alert.alert('Download unavailable', 'QR code image is not available yet.');
    }

    const filename = `parkeasy_qr_${bookingIdStr || Date.now()}.jpg`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    try {
      const downloadResult = await FileSystem.downloadAsync(booking.qrCodeImage, fileUri);
      if (downloadResult.status !== 200 && downloadResult.status !== 201) {
        throw new Error('Download failed');
      }

      if (Constants.appOwnership === 'expo') {
        return Alert.alert(
          'Saved locally',
          `QR code downloaded as JPG to the app cache. To save it to your device gallery, use a development build or standalone app.\n\nPath: ${downloadResult.uri}`
        );
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission required', 'Please allow photo library access to save the QR image.');
      }

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      try {
        await MediaLibrary.createAlbumAsync('ParkEasy', asset, false);
      } catch (e) {
        // album may already exist — ignore
      }

      Alert.alert('Saved', 'QR code saved as JPG to your gallery.');
    } catch (error) {
      console.error('QR download error:', error);
      Alert.alert(
        'Download failed',
        'Unable to save the QR code. In Expo Go, full media-library access requires a development build.'
      );
    }
  };

  const getStatusBadgeStyle = (status) => {
    if (isDarkMode) {
      switch (status) {
        case 'active':
          return { bg: '#8A6B00', text: '#FFFDE7', label: 'ACTIVE' };
        case 'completed':
          return { bg: '#0D47A1', text: '#E3F2FD', label: 'COMPLETED' };
        case 'cancelled':
          return { bg: '#B71C1C', text: '#FFEBEE', label: 'CANCELLED' };
        case 'pending_payment':
          return { bg: '#A75D00', text: '#FFE0B2', label: 'PENDING PAYMENT' };
        case 'booked':
        default:
          return { bg: COLORS.primary, text: COLORS.oliveDark, label: 'BOOKED' };
      }
    }
    switch (status) {
      case 'active':
        return { bg: '#FFF9C4', text: '#6D5E08', label: 'ACTIVE' }; 
      case 'completed':
        return { bg: '#E3F2FD', text: '#0D47A1', label: 'COMPLETED' };
      case 'cancelled':
        return { bg: '#FFEBEE', text: '#C62828', label: 'CANCELLED' };
      case 'pending_payment':
        return { bg: '#FFF3E0', text: '#E65100', label: 'PENDING PAYMENT' };
      case 'booked':
      default:
        return { bg: COLORS.primary, text: COLORS.oliveDark, label: 'BOOKED' }; 
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.push('/user-home')} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#3D3D3D' : '#F5F5F5' }]}>
          <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#FFF' : COLORS.oliveDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Booking Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Success Animation */}
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark" size={52} color={COLORS.oliveDark} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.successTitle, { color: theme.text }]}>Booking Confirmed! 🎉</Text>
          <Text style={[styles.successSubtitle, { color: theme.textLight }]}>Your parking slot is reserved</Text>
        </Animated.View>

        {/* E-Ticket */}
        <Animated.View style={[styles.ticket, { opacity: fadeAnim, backgroundColor: theme.surface }]}>
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderLeft}>
              <Text style={styles.ticketBrand}>🅿️ ParkEasy</Text>
              <Text style={styles.ticketBookingId}>#{bookingIdStr?.slice(-8).toUpperCase()}</Text>
            </View>
            {(() => {
              const badge = getStatusBadgeStyle(booking.status);
              return (
                <View style={[styles.ticketStatusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.ticketStatusText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Tear Line */}
          <View style={styles.tearLine}>
            <View style={[styles.tearCircleLeft, { backgroundColor: theme.background }]} />
            <View style={[styles.tearDashes, { borderColor: theme.border }]} />
            <View style={[styles.tearCircleRight, { backgroundColor: theme.background }]} />
          </View>

          {/* Parking Info */}
          <View style={styles.ticketSection}>
            <View style={styles.ticketRow}>
              <Ionicons name="location" size={16} color={isDarkMode ? '#FBD427' : COLORS.olive} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.ticketLabel, { color: theme.textLight }]}>Location</Text>
                <Text style={[styles.ticketValue, { color: theme.text }]}>{parkingName}</Text>
                <Text style={[styles.ticketSub, { color: theme.textLight }]}>{address}</Text>
              </View>
            </View>
          </View>

          {/* Time Slots */}
          <View style={[styles.timeGrid, { backgroundColor: isDarkMode ? '#333333' : '#FAFAF7' }]}>
            <View style={styles.timeGridItem}>
              <Text style={[styles.timeGridLabel, { color: theme.textLight }]}>Check In</Text>
              <Text style={[styles.timeGridTime, { color: isDarkMode ? '#FBD427' : COLORS.oliveDark }]}>{start.time}</Text>
              <Text style={[styles.timeGridDate, { color: theme.textLight }]}>{start.date}</Text>
            </View>
            <View style={styles.timeGridArrow}>
              <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.timeGridItem}>
              <Text style={[styles.timeGridLabel, { color: theme.textLight }]}>Check Out</Text>
              <Text style={[styles.timeGridTime, { color: isDarkMode ? '#FBD427' : COLORS.oliveDark }]}>{end.time}</Text>
              <Text style={[styles.timeGridDate, { color: theme.textLight }]}>{end.date}</Text>
            </View>
          </View>

          {/* Vehicle, Spot & Amount */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textLight }]}>Vehicle</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {booking.vehicleType === 'car' ? '🚗' : '🏍️'} {booking.vehicleNumber || (booking.vehicleType === 'car' ? 'Car' : 'Bike')}
              </Text>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: theme.border }]} />
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textLight }]}>Spot No.</Text>
              <Text style={[styles.detailValue, { color: isDarkMode ? '#FBD427' : COLORS.olive }]}>{spotName}</Text>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: theme.border }]} />
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textLight }]}>Amount</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>₹{booking.totalAmount}</Text>
            </View>
          </View>

          {/* Entry & Exit Logs */}
          {(booking.entryTime || booking.exitTime) && (
            <>
              <View style={styles.tearLine}>
                <View style={[styles.tearCircleLeft, { backgroundColor: theme.background }]} />
                <View style={[styles.tearDashes, { borderColor: theme.border }]} />
                <View style={[styles.tearCircleRight, { backgroundColor: theme.background }]} />
              </View>
              <View style={styles.ticketSection}>
                <Text style={[styles.qrTitle, { marginBottom: 12, fontSize: 13, color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Gate Logs</Text>
                
                {booking.entryTime && (
                  <View style={[styles.ticketRow, { marginBottom: booking.exitTime ? 12 : 0 }]}>
                    <Ionicons name="log-in" size={16} color="#2E7D32" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.ticketLabel, { color: theme.textLight }]}>Checked In</Text>
                      <Text style={[styles.ticketValue, { color: theme.text }]}>
                        {new Date(booking.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Text>
                      <Text style={[styles.ticketSub, { color: theme.textLight }]}>
                        {new Date(booking.entryTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                )}

                {booking.exitTime && (
                  <View style={styles.ticketRow}>
                    <Ionicons name="log-out" size={16} color="#0D47A1" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.ticketLabel, { color: theme.textLight }]}>Checked Out</Text>
                      <Text style={[styles.ticketValue, { color: theme.text }]}>
                        {new Date(booking.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Text>
                      <Text style={[styles.ticketSub, { color: theme.textLight }]}>
                        {new Date(booking.exitTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Tear Line */}
          <View style={styles.tearLine}>
            <View style={[styles.tearCircleLeft, { backgroundColor: theme.background }]} />
            <View style={[styles.tearDashes, { borderColor: theme.border }]} />
            <View style={[styles.tearCircleRight, { backgroundColor: theme.background }]} />
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Text style={[styles.qrTitle, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Scan at Entry Gate</Text>
            {booking.qrCodeImage ? (
              <Image
                source={{ uri: booking.qrCodeImage }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.qrFallback, { backgroundColor: isDarkMode ? '#333' : COLORS.badgeBg }]}>
                <Text style={[styles.qrFallbackText, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>{booking.qrCode}</Text>
                <Text style={[styles.qrHint, { color: theme.textLight }]}>Show this code at the parking gate</Text>
              </View>
            )}
            <Text style={[styles.qrNote, { color: theme.textLight }]}>Valid for this booking only</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={18} color={isDarkMode ? '#FFF' : COLORS.oliveDark} />
            <Text style={[styles.shareBtnText, { color: theme.text }]}>Share Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.downloadBtn, { backgroundColor: isDarkMode ? '#1E2D1E' : '#F0FFF0', borderColor: isDarkMode ? '#2E7D32' : COLORS.olive }]} onPress={handleDownloadQR} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={18} color={isDarkMode ? '#81C784' : COLORS.oliveDark} />
            <Text style={[styles.shareBtnText, { color: isDarkMode ? '#81C784' : COLORS.oliveDark }]}>Download JPG</Text>
          </TouchableOpacity>
          
        </Animated.View>

        {/* View Bookings Link */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', marginBottom: 40 }}>
          <TouchableOpacity onPress={() => navigation.push('/my-bookings')}>
            <Text style={[styles.viewAllText, { color: isDarkMode ? '#FBD427' : COLORS.olive }]}>View All Bookings</Text>
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
  },
  downloadBtn: {
    backgroundColor: '#F0FFF0',
    borderColor: COLORS.olive,
  },
  shareBtnText: {
    fontSize: SIZES.font,
    fontWeight: '700',
    color: COLORS.oliveDark,
  },
  homeBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  viewAllText: {
    fontSize: SIZES.font,
    color: COLORS.olive,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
