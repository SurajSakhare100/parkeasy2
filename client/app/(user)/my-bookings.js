import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Platform, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import bookingService from '../../services/bookingService';

const STATUS_CONFIG = {
  booked: { label: 'Booked', bg: '#E8F5E9', text: '#2E7D32' },
  active: { label: 'Active', bg: '#FFF9C4', text: '#6D5E08' },
  pending_payment: { label: 'Incomplete', bg: '#FFF3E0', text: '#E65100' },
  completed: { label: 'Completed', bg: '#F5F5F5', text: '#616161' },
  cancelled: { label: 'Cancelled', bg: '#FFEBEE', text: '#C62828' },
};

function formatSlot(startTime, endTime) {
  const s = new Date(startTime);
  const e = new Date(endTime);
  const toTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const toDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${toDate(s)}  ·  ${toTime(s)} → ${toTime(e)}`;
}

export default function MyBookingsScreen() {
  const navigation = useRouter();
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (error) {
      // API error already logged
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const activeStatuses = ['booked', 'active', 'pending_payment'];
  const completedStatuses = ['completed', 'cancelled'];

  const filtered = bookings.filter((b) =>
    activeTab === 'ACTIVE'
      ? activeStatuses.includes(b.status)
      : completedStatuses.includes(b.status)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.back() : navigation.replace('/user-home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.oliveDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        {['ACTIVE', 'COMPLETED'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.toggleButton, activeTab === tab && styles.toggleButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.toggleText, activeTab === tab && styles.toggleTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="car-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} bookings</Text>
          <Text style={styles.emptySubtitle}>Your bookings will appear here</Text>
          <TouchableOpacity
            style={styles.findParkingBtn}
            onPress={() => navigation.push('/user-home')}
          >
            <Text style={styles.findParkingBtnText}>Find Parking</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {filtered.map((item) => {
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.booked;
            const parking = item.parkingId;
            const imgUri = parking?.images?.[0] ||
              'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=200&h=200&fit=crop';

            return (
              <View key={item._id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Image source={{ uri: imgUri }} style={styles.cardImage} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {parking?.name || 'Parking'}
                    </Text>
                    <Text style={styles.cardAddress} numberOfLines={1}>
                      {parking?.address || '—'}
                    </Text>
                    <Text style={styles.slotText} numberOfLines={1}>
                      {formatSlot(item.startTime, item.endTime)}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>
                        ₹{item.totalAmount}
                        <Text style={styles.priceUnit}> total</Text>
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusCfg.text }]}>
                          {statusCfg.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.btnOutline}
                    onPress={() => navigation.push({
                      pathname: '/ticket',
                      params: {
                        booking: {
                          id: item._id,
                          parkingName: parking?.name,
                          address: parking?.address,
                          vehicleType: item.vehicleType,
                          startTime: item.startTime,
                          endTime: item.endTime,
                          totalAmount: item.totalAmount,
                          qrCode: item.qrCode,
                          qrCodeImage: item.qrCodeImage,
                          status: item.status,
                        }
                      }
                    })}
                  >
                    <Ionicons name="qr-code-outline" size={15} color={COLORS.olive} style={{ marginRight: 5 }} />
                    <Text style={styles.btnOutlineText}>View Ticket</Text>
                  </TouchableOpacity>

                  {activeTab === 'ACTIVE' ? (
                    <TouchableOpacity
                      style={styles.btnSolid}
                      onPress={() => navigation.push({ pathname: '/parking-details', params: { parking: JSON.stringify(parking) } })}
                    >
                      <Text style={styles.btnSolidText}>View Details</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.btnSolid}
                      onPress={() => navigation.push({ pathname: '/parking-details', params: { parking: JSON.stringify(parking) } })}
                    >
                      <Text style={styles.btnSolidText}>Book Again</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.oliveDark,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: SIZES.font, fontWeight: '700', color: COLORS.textLight,
  },
  toggleTextActive: {
    color: COLORS.oliveDark,
  },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12, color: COLORS.textLight, fontSize: SIZES.font,
  },
  emptyTitle: {
    marginTop: 16, fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.oliveDark,
  },
  emptySubtitle: {
    marginTop: 6, fontSize: SIZES.font, color: COLORS.textLight, textAlign: 'center',
  },
  findParkingBtn: {
    marginTop: 24, backgroundColor: COLORS.primary,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10,
  },
  findParkingBtnText: {
    fontSize: SIZES.font, fontWeight: 'bold', color: COLORS.oliveDark,
  },
  listContainer: {
    paddingHorizontal: 20, paddingBottom: 100,
  },
  card: {
    borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 16,
    padding: 15, marginBottom: 16, backgroundColor: '#FFF', ...SHADOWS.light,
  },
  cardTop: {
    flexDirection: 'row', marginBottom: 14,
  },
  cardImage: {
    width: 72, height: 72, borderRadius: 12, marginRight: 14, backgroundColor: '#EEE',
  },
  cardInfo: {
    flex: 1, justifyContent: 'center',
  },
  cardTitle: {
    fontSize: SIZES.medium, fontWeight: 'bold', color: '#333', marginBottom: 3,
  },
  cardAddress: {
    fontSize: 12, color: COLORS.textLight, marginBottom: 4,
  },
  slotText: {
    fontSize: 11, color: COLORS.textMuted, marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  price: {
    fontSize: SIZES.font, fontWeight: 'bold', color: COLORS.olive,
  },
  priceUnit: {
    fontSize: 12, fontWeight: '600', color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11, fontWeight: '700',
  },
  divider: {
    height: 1, backgroundColor: '#F4F4F4', marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 10,
  },
  btnOutline: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  btnOutlineText: {
    fontSize: SIZES.font, fontWeight: '700', color: COLORS.olive,
  },
  btnSolid: {
    flex: 1, backgroundColor: COLORS.primary,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  btnSolidText: {
    fontSize: SIZES.font, fontWeight: '700', color: COLORS.oliveDark,
  },
});
