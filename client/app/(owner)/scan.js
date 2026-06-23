import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import bookingService from '../../services/bookingService';
import { COLORS, SHADOWS } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const FINDER_SIZE = SCREEN_W * 0.68;
const CORNER = 24;
const CORNER_THICKNESS = 4;

// Corner bracket component for the QR viewfinder
function Corner({ position }) {
  const style = {
    tl: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
    tr: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
    bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
    br: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  }[position];

  return (
    <View
      style={[{
        position: 'absolute',
        width: CORNER,
        height: CORNER,
        borderColor: '#FBD427',
        borderRadius: 2,
      }, style]}
    />
  );
}

export default function OwnerScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [manualToken, setManualToken] = useState('');

  const parseToken = (raw) => {
    let token = raw.trim();
    try {
      const parsed = JSON.parse(token);
      if (parsed && typeof parsed === 'object' && parsed.token) return parsed.token;
    } catch (_) {}
    try {
      const url = new URL(token);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1];
    } catch (_) {}
    return token;
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (!scanning) return;
    setScanning(false);
    setLoading(true);
    try {
      const token = parseToken(data);
      const res = await bookingService.scanByToken(token);
      setBooking(res);
      if (res.transition === 'check_in') {
        Alert.alert('✅ Checked In', 'Booking marked as active. Entry time recorded.');
      } else if (res.transition === 'check_out') {
        Alert.alert('🏁 Checked Out', 'Booking completed. Exit time recorded.');
      } else if (res.transition === 'already_completed') {
        Alert.alert('ℹ️ Already Checked Out', 'This booking has already been checked out.');
      }
    } catch (err) {
      Alert.alert('Scan Failed', err.response?.data?.message || 'Could not find booking for this QR');
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    if (!manualToken.trim()) return Alert.alert('Enter a token');
    setLoading(true);
    try {
      const token = parseToken(manualToken);
      const res = await bookingService.scanByToken(token);
      setBooking(res);
      if (res.transition === 'check_in') {
        Alert.alert('✅ Checked In', 'Booking marked as active. Entry time recorded.');
      } else if (res.transition === 'check_out') {
        Alert.alert('🏁 Checked Out', 'Booking completed. Exit time recorded.');
      } else if (res.transition === 'already_completed') {
        Alert.alert('ℹ️ Already Checked Out', 'This booking has already been checked out.');
      }
    } catch (e) {
      Alert.alert('Lookup Failed', e.response?.data?.message || e.message || 'Could not find booking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active:          { bg: '#E6F4EA', text: '#137333', label: 'Active — Parked' },
      completed:       { bg: '#E8F0FE', text: '#1A73E8', label: 'Completed' },
      booked:          { bg: '#E8F5E9', text: '#2E7D32', label: 'Booked — Awaiting Entry' },
      cancelled:       { bg: '#FCE8E6', text: '#C5221F', label: 'Cancelled' },
      pending_payment: { bg: '#FEF7E0', text: '#B06000', label: 'Pending Payment' },
      failed:          { bg: '#FCE8E6', text: '#C5221F', label: 'Failed' },
      incomplete:      { bg: '#FEF7E0', text: '#B06000', label: 'Incomplete' },
    };
    return map[status] || map.pending_payment;
  };

  /* ─── Permission loading ─── */
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.olive} />
      </View>
    );
  }

  /* ─── Permission denied / not granted ─── */
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.permissionScroll} showsVerticalScrollIndicator={false}>
          <Ionicons name="camera-outline" size={72} color={COLORS.olive} style={{ marginBottom: 20 }} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionDesc}>
            Camera access is needed to scan booking QR codes at the entry/exit gate.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={requestPermission}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.btnText}>Grant Camera Access</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.manualEntryTitle}>Enter Booking Token Manually</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Paste booking token / URL"
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={[styles.btn, styles.lookupBtn]} onPress={handleManualLookup}>
              <Text style={styles.btnText}>Go</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={COLORS.primary} /></View>}
      </SafeAreaView>
    );
  }

  /* ─── Scanner view ─── */
  if (!booking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Full-screen camera */}
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Dark overlay with transparent finder hole */}
        <View style={styles.overlay}>
          {/* Top mask */}
          <View style={styles.maskTop} />
          <View style={styles.maskMiddleRow}>
            {/* Left mask */}
            <View style={styles.maskSide} />
            {/* Finder box */}
            <View style={styles.finder}>
              <Corner position="tl" />
              <Corner position="tr" />
              <Corner position="bl" />
              <Corner position="br" />
            </View>
            {/* Right mask */}
            <View style={styles.maskSide} />
          </View>
          {/* Bottom mask with hint */}
          <View style={styles.maskBottom}>
            <Text style={styles.hintText}>Align the QR code inside the square</Text>
          </View>
        </View>

        {/* Top label */}
        <SafeAreaView style={styles.topBar} edges={['top']}>
          <Text style={styles.topBarTitle}>🅿️ Scan Booking QR</Text>
        </SafeAreaView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </View>
    );
  }

  /* ─── Booking result ─── */
  const badge = getStatusBadge(booking.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.resultScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.resultHeader}>
          <Ionicons name="checkmark-circle" size={40} color="#2E7D32" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.resultHeaderTitle}>Booking Found</Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>
        </View>

        {/* Booking ID */}
        <View style={styles.card}>
          <Text style={styles.cardSection}>Booking Reference</Text>
          <Text style={styles.bookingId} numberOfLines={1} ellipsizeMode="middle">
            {booking.bookingId || booking._id}
          </Text>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardSection}>Customer</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={36} color={COLORS.olive} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoTitle}>{booking.userId?.name || 'N/A'}</Text>
              <Text style={styles.infoSub}>{booking.userId?.email || '—'}</Text>
              {booking.userId?.phone ? <Text style={styles.infoSub}>{booking.userId.phone}</Text> : null}
            </View>
          </View>
        </View>

        {/* Parking */}
        <View style={styles.card}>
          <Text style={styles.cardSection}>Parking Location</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={36} color={COLORS.olive} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoTitle}>{booking.parkingId?.name || 'N/A'}</Text>
              <Text style={styles.infoSub}>{booking.parkingId?.address || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Details grid */}
        <View style={styles.card}>
          <Text style={styles.cardSection}>Booking Details</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Slot</Text>
              <Text style={styles.gridValue}>{booking.spotName}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Vehicle</Text>
              <Text style={styles.gridValue}>{booking.vehicleType === 'car' ? '🚗' : '🏍️'} {booking.vehicleNumber || (booking.vehicleType === 'car' ? 'Car' : 'Bike')}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Amount</Text>
              <Text style={styles.gridValue}>₹{booking.totalAmount}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Payment</Text>
              <Text style={styles.gridValue}>{booking.paymentId?.status || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Time window */}
        <View style={styles.card}>
          <Text style={styles.cardSection}>Reserved Time Window</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Check-In</Text>
              <Text style={styles.timeValue}>
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.timeSub}>{new Date(booking.startTime).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Check-Out</Text>
              <Text style={styles.timeValue}>
                {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.timeSub}>{new Date(booking.endTime).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Gate log */}
        {(booking.entryTime || booking.exitTime) && (
          <View style={styles.card}>
            <Text style={styles.cardSection}>Gate Log</Text>
            {booking.entryTime && (
              <View style={[styles.infoRow, { marginBottom: booking.exitTime ? 12 : 0 }]}>
                <View style={[styles.logIcon, { backgroundColor: '#E6F4EA' }]}>
                  <Ionicons name="log-in" size={18} color="#137333" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.gridLabel}>Entry Recorded</Text>
                  <Text style={[styles.infoTitle, { color: '#137333' }]}>
                    {new Date(booking.entryTime).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            {booking.exitTime && (
              <View style={styles.infoRow}>
                <View style={[styles.logIcon, { backgroundColor: '#E8F0FE' }]}>
                  <Ionicons name="log-out" size={18} color="#1A73E8" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.gridLabel}>Exit Recorded</Text>
                  <Text style={[styles.infoTitle, { color: '#1A73E8' }]}>
                    {new Date(booking.exitTime).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Scan next button */}
        <TouchableOpacity
          style={styles.scanNextBtn}
          onPress={() => { setBooking(null); setScanning(true); }}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Scan Next QR</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* ── Permission ── */
  permissionScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28, paddingBottom: 120 },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.oliveDark, marginBottom: 10, textAlign: 'center' },
  permissionDesc: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#DDD' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  manualEntryTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12, alignSelf: 'flex-start' },
  manualRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 },
  manualInput: { flex: 1, borderWidth: 1.5, borderColor: '#DDD', padding: 12, borderRadius: 12, backgroundColor: '#FFF', fontSize: 14 },
  lookupBtn: { paddingHorizontal: 18, paddingVertical: 14 },

  /* ── Camera / Overlay ── */
  overlay: { flex: 1 },
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' },
  maskMiddleRow: { flexDirection: 'row' },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' },
  maskBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20 },
  finder: {
    width: FINDER_SIZE,
    height: FINDER_SIZE,
    backgroundColor: 'transparent',
  },
  hintText: { color: '#FFF', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 8 },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },

  /* ── Result ── */
  resultScroll: { padding: 16, paddingBottom: 120 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.light },
  resultHeaderTitle: { fontSize: 18, fontWeight: '800', color: COLORS.oliveDark, marginBottom: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  bookingId: { fontSize: 13, color: COLORS.textLight, fontFamily: 'monospace', marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.light },
  cardSection: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  infoSub: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '50%', marginBottom: 12 },
  gridLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 3 },
  gridValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  timeBlock: { alignItems: 'center', flex: 1 },
  timeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: COLORS.textMuted, marginBottom: 4 },
  timeValue: { fontSize: 20, fontWeight: '800', color: COLORS.oliveDark },
  timeSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  logIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  /* ── Buttons ── */
  btn: { backgroundColor: COLORS.olive, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  scanNextBtn: { backgroundColor: COLORS.olive, paddingVertical: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 },

  /* ── Loading ── */
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.75)' },
});
