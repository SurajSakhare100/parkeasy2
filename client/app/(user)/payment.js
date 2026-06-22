import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
   Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import paymentService from '../../services/paymentService';
import { useTheme } from '../../context/ThemeContext';

export default function PaymentScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { bookingId, totalAmount, durationHours, parking: parkingParam, vehicleType, startTime, endTime } = params;
  const parking = typeof parkingParam === 'string' ? JSON.parse(parkingParam) : parkingParam;

  const [step, setStep] = useState('summary'); // 'summary' | 'webview' | 'loading'
  const [orderData, setOrderData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const webViewRef = useRef(null);

  const handleInitiatePayment = async () => {
    setPaymentLoading(true);
    try {
      const order = await paymentService.createOrder(bookingId);
      setOrderData(order);
      setStep('webview');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'PAYMENT_SUCCESS') {
        setStep('loading');
        const result = await paymentService.verifyPayment({
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          bookingId,
        });

        router.replace({ pathname: '/ticket', params: { booking: JSON.stringify(result.booking) } });

      } else if (data.type === 'PAYMENT_FAILED') {
        setStep('summary');
        Alert.alert(
          'Payment Failed',
          'Your payment could not be processed. Please try again.',
          [{ text: 'Try Again' }]
        );
      } else if (data.type === 'PAYMENT_DISMISSED') {
        setStep('summary');
      }
    } catch (error) {
      setStep('summary');
      Alert.alert('Verification Error', 'Payment verification failed. Contact support.');
    }
  };

  // Razorpay HTML checkout page injected into WebView
  const getRazorpayHTML = () => {
    if (!orderData) return '';
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #F8F7F2; font-family: -apple-system, sans-serif; }
    .loader {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100vh;
    }
    .loader-text { color: #4C4223; font-size: 16px; font-weight: 600; margin-top: 12px; }
    .spinner {
      width: 48px; height: 48px; border: 4px solid #EAE5CD;
      border-top: 4px solid #FBD427; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p class="loader-text">Opening Razorpay...</p>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var options = {
      key: "${orderData.key}",
      amount: "${orderData.amount}",
      currency: "${orderData.currency}",
      name: "ParkEasy",
      description: "Parking Booking - ${parking.name}",
      order_id: "${orderData.orderId}",
      theme: { color: "#FBD427" },
      prefill: { name: "", email: "", contact: "" },
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "PAYMENT_SUCCESS",
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        }));
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "PAYMENT_DISMISSED"
          }));
        }
      }
    };
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "PAYMENT_FAILED",
        error: response.error
      }));
    });
    setTimeout(function() { rzp.open(); }, 500);
  </script>
</body>
</html>`;
  };

  // ── Loading / Verifying Screen ──
  if (step === 'loading') {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Verifying your payment…</Text>
        <Text style={[styles.loadingSubText, { color: theme.textLight }]}>Please wait, do not close the app</Text>
      </SafeAreaView>
    );
  }

  // ── Razorpay WebView ──
  if (step === 'webview') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.webviewHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => setStep('summary')} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#3D3D3D' : '#F5F5F5' }]}>
            <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#FFF' : COLORS.oliveDark} />
          </TouchableOpacity>
          <Text style={[styles.webviewHeaderTitle, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Razorpay Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          ref={webViewRef}
          source={{ html: getRazorpayHTML() }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          style={{ flex: 1 }}
          renderLoading={() => (
            <View style={[styles.webviewLoader, { backgroundColor: theme.background }]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  // ── Payment Summary ──
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#3D3D3D' : '#F5F5F5' }]}>
          <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#FFF' : COLORS.oliveDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Payment Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Secured badge */}
        <View style={[styles.secureBadge, { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' }]}>
          <Ionicons name="shield-checkmark" size={16} color={isDarkMode ? '#E8F5E9' : '#2E7D32'} />
          <Text style={[styles.secureBadgeText, { color: isDarkMode ? '#E8F5E9' : '#2E7D32' }]}>100% Secure Payment via Razorpay</Text>
        </View>

        {/* Booking Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Booking Summary</Text>

          <View style={styles.cardRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: isDarkMode ? '#3D3D3D' : COLORS.badgeBg }]}>
              <Ionicons name="location-outline" size={18} color={isDarkMode ? '#FBD427' : COLORS.olive} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardRowLabel, { color: theme.textLight }]}>Parking Spot</Text>
              <Text style={[styles.cardRowValue, { color: theme.text }]}>{parking.name}</Text>
              <Text style={[styles.cardRowSub, { color: theme.textLight }]}>{parking.address}</Text>
            </View>
          </View>

          <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

          <View style={styles.cardRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: isDarkMode ? '#3D3D3D' : COLORS.badgeBg }]}>
              <Ionicons name={vehicleType === 'car' ? 'car-outline' : 'bicycle-outline'} size={18} color={isDarkMode ? '#FBD427' : COLORS.olive} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardRowLabel, { color: theme.textLight }]}>Vehicle Type</Text>
              <Text style={[styles.cardRowValue, { color: theme.text }]}>{vehicleType === 'car' ? '🚗 Car' : '🏍️ Bike'}</Text>
            </View>
          </View>

          <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

          <View style={styles.cardRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: isDarkMode ? '#3D3D3D' : COLORS.badgeBg }]}>
              <Ionicons name="time-outline" size={18} color={isDarkMode ? '#FBD427' : COLORS.olive} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardRowLabel, { color: theme.textLight }]}>Slot</Text>
              <Text style={[styles.cardRowValue, { color: theme.text }]}>
                {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                {' → '}
                {endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </Text>
              <Text style={[styles.cardRowSub, { color: theme.textLight }]}>{durationHours} hr{durationHours !== 1 ? 's' : ''} · {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
            </View>
          </View>
        </View>

        {/* Fare Breakdown */}
        <View style={[styles.fareCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Price Details</Text>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: theme.textLight }]}>Parking Rate</Text>
            <Text style={[styles.fareValue, { color: theme.text }]}>₹{parking.pricePerHour}/hr</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: theme.textLight }]}>Duration</Text>
            <Text style={[styles.fareValue, { color: theme.text }]}>{durationHours} hr{durationHours !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: theme.textLight }]}>Platform Fee</Text>
            <Text style={[styles.fareValue, { color: '#2E7D32' }]}>FREE</Text>
          </View>
          <View style={[styles.fareDivider, { backgroundColor: theme.border }]} />
          <View style={styles.fareRow}>
            <Text style={[styles.fareTotalLabel, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Total Payable</Text>
            <Text style={[styles.fareTotalValue, { color: isDarkMode ? '#FBD427' : COLORS.olive }]}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Payment Methods Info */}
        <View style={[styles.methodsCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>Payment Methods</Text>
          <View style={styles.methodsGrid}>
            {['UPI', 'Cards', 'Net Banking', 'Wallets'].map((m) => (
              <View key={m} style={[styles.methodChip, { backgroundColor: isDarkMode ? '#3D3D3D' : COLORS.badgeBg, borderColor: isDarkMode ? '#555' : '#E5DFA0' }]}>
                <Text style={[styles.methodChipText, { color: isDarkMode ? '#FFF' : COLORS.olive }]}>{m}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.methodsNote, { color: theme.textLight }]}>Powered by Razorpay • PCI DSS Compliant</Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerLabel, { color: theme.textLight }]}>Amount to Pay</Text>
          <Text style={[styles.footerAmount, { color: isDarkMode ? '#FFF' : COLORS.oliveDark }]}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, paymentLoading && { opacity: 0.7 }]}
          onPress={handleInitiatePayment}
          disabled={paymentLoading}
          activeOpacity={0.85}
        >
          {paymentLoading ? (
            <ActivityIndicator color={COLORS.oliveDark} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color={COLORS.oliveDark} style={{ marginRight: 8 }} />
              <Text style={styles.payBtnText}>Pay ₹{totalAmount}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7F2',
  },
  loadingText: {
    marginTop: 20,
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: SIZES.font,
    color: COLORS.textLight,
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  webviewHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  webviewLoader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    paddingBottom: 140,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  secureBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  fareCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  methodsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  cardTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardRowLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardRowValue: {
    fontSize: SIZES.font,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardRowSub: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 14,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fareLabel: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
  },
  fareValue: {
    fontSize: SIZES.font,
    fontWeight: '600',
    color: COLORS.text,
  },
  fareDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  fareTotalLabel: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  fareTotalValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.olive,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  methodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.badgeBg,
    borderWidth: 1,
    borderColor: '#E5DFA0',
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.olive,
  },
  methodsNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    ...SHADOWS.medium,
  },
  footerLeft: {
    marginRight: 16,
  },
  footerLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  footerAmount: {
    fontSize: SIZES.title,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
  payBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  payBtnText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
  },
});
