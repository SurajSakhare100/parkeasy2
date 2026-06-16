import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import bookingService from '../../services/bookingService';
import { COLORS, SIZES, SHADOWS } from '../../theme';

export default function OwnerScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [BarCodeScannerModule, setBarCodeScannerModule] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const imported = await import('expo-barcode-scanner');
        const module = imported?.default || imported;
        const ScannerComponent = module?.BarCodeScanner ?? null;
        setBarCodeScannerModule(ScannerComponent);

        if (module && module.requestPermissionsAsync) {
          const { status } = await module.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        } else {
          setHasPermission(false);
        }
      } catch (err) {
        // Native module not available in this binary (Expo Go or dev client mismatch)
        console.warn('expo-barcode-scanner not available:', err.message || err);
        setBarCodeScannerModule(null);
        setHasPermission(false);
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (!scanning) return;
    setScanning(false);

    try {
      // QR payload is expected to be the scan URL e.g. https://.../api/booking/scan/<token>
      let token = data;
      try {
        const url = new URL(data);
        const parts = url.pathname.split('/').filter(Boolean);
        token = parts[parts.length - 1];
      } catch (e) {
        // not a URL, assume raw token
      }

      setLoading(true);
      const res = await bookingService.scanByToken(token);
      setBooking(res);
    } catch (err) {
      console.error('Scan error', err);
      Alert.alert('Scan Failed', err.response?.data?.message || 'Could not find booking for this QR');
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  // If the native scanner module is not available or permission is denied, show a fallback UI to enter token manually
  if (!BarCodeScannerModule || hasPermission === false) {
    const fallbackMessage = hasPermission === false
      ? 'Camera permission was denied. You can enter the booking token manually below.'
      : 'QR scanner is not available in this app build. You can enter the booking token manually below or install a development build that includes `expo-barcode-scanner`.';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginHorizontal: 20 }}>
            {fallbackMessage}
          </Text>
          <View style={{ width: '90%', marginTop: 12 }}>
            <Text style={{ marginBottom: 6, color: COLORS.textLight }}>Booking token</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, backgroundColor: '#fff' }}
                placeholder="Paste token here"
                value={manualToken}
                onChangeText={setManualToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={[styles.btn, { marginLeft: 8 }]} onPress={async () => {
                if (!manualToken) return Alert.alert('Enter token');
                setLoading(true);
                try {
                  const res = await bookingService.scanByToken(manualToken.trim());
                  setBooking(res);
                } catch (e) {
                  Alert.alert('Scan Failed', e.response?.data?.message || e.message || 'Could not find booking');
                } finally { setLoading(false); }
              }}>
                <Text style={styles.btnText}>Lookup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!booking ? (
        <View style={{ flex: 1 }}>
          <BarCodeScannerModule
            onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
            style={styles.camera}
          />
          <View style={styles.scanHint}>
            <Text style={styles.hintText}>Point the camera at the booking QR code</Text>
          </View>
        </View>
      ) : (
        <View style={styles.resultCard}>
          <Text style={styles.title}>Booking Details</Text>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{booking.userId?.name} • {booking.userId?.email}</Text>

          <Text style={styles.label}>Parking:</Text>
          <Text style={styles.value}>{booking.parkingId?.name}</Text>
          <Text style={styles.sub}>{booking.parkingId?.address}</Text>

          <Text style={styles.label}>Slot:</Text>
          <Text style={styles.value}>{booking.spotName}</Text>

          <Text style={styles.label}>Times:</Text>
          <Text style={styles.value}>{new Date(booking.startTime).toLocaleString()} → {new Date(booking.endTime).toLocaleString()}</Text>

          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{booking.status}</Text>

          {booking.qrCodeImage ? (
            <Image source={{ uri: booking.qrCodeImage }} style={styles.qrImage} />
          ) : null}

          <TouchableOpacity style={styles.btn} onPress={() => { setBooking(null); setScanning(true); }}>
            <Ionicons name="camera" size={18} color="#fff" />
            <Text style={styles.btnText}>Scan Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1 },
  scanHint: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  hintText: { color: '#FFF', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  resultCard: { padding: 20, margin: 16, backgroundColor: '#FFF', borderRadius: 12, ...SHADOWS.light },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.oliveDark, marginBottom: 10 },
  label: { marginTop: 10, color: COLORS.textLight, fontWeight: '700' },
  value: { color: COLORS.text, fontSize: 15 },
  sub: { color: COLORS.textLight, fontSize: 13, marginTop: 4 },
  btn: { marginTop: 18, backgroundColor: COLORS.olive, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', marginLeft: 8, fontWeight: '700' },
  qrImage: { width: 180, height: 180, marginTop: 12, alignSelf: 'center' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' }
});
