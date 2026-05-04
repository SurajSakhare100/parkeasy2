import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/authService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default role
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Animation for role selector
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: role === 'customer' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }, [role]);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!otpSent) {
      setLoading(true);
      try {
        await authService.sendOtp(phone);
        setOtpSent(true);
        Alert.alert('OTP Sent', 'An OTP has been sent to your mobile number.');
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      await authService.register(name, email, phone, password, role, otp);
      Alert.alert('Success', 'Account created successfully! Please login.');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const selectorWidth = (width - 48 - 8) / 2;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, selectorWidth],
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/parkicon.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.brandName}>ParkEasy</Text>
            <Text style={styles.subtitle}>Join our community</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Register</Text>

            {/* Role Selection (Segmented Control) */}
            <View style={styles.segmentedContainer}>
              <Animated.View 
                style={[
                  styles.activeSegment, 
                  { width: selectorWidth, transform: [{ translateX }] }
                ]} 
              />
              <TouchableOpacity
                style={styles.segmentBtn}
                onPress={() => setRole('customer')}
                activeOpacity={1}
              >
                <Ionicons 
                  name="person" 
                  size={18} 
                  color={role === 'customer' ? COLORS.oliveDark : COLORS.textLight} 
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.segmentText, role === 'customer' && styles.segmentTextActive]}>
                  User
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.segmentBtn}
                onPress={() => setRole('owner')}
                activeOpacity={1}
              >
                <Ionicons 
                  name="business" 
                  size={18} 
                  color={role === 'owner' ? COLORS.oliveDark : COLORS.textLight} 
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.segmentText, role === 'owner' && styles.segmentTextActive]}>
                  Owner
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={COLORS.olive} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.textLight}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.olive} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={COLORS.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={COLORS.olive} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor={COLORS.textLight}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.olive} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>

              {otpSent && (
                <View style={[styles.inputWrapper, { borderColor: COLORS.primary }]}>
                  <Ionicons name="chatbubbles-outline" size={20} color={COLORS.olive} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor={COLORS.textLight}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    autoFocus={true}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerBtnText}>
                {loading ? 'Please wait...' : (!otpSent ? 'Send OTP' : 'Verify & Register')}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color={COLORS.oliveDark} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  logo: {
    width: 50,
    height: 50,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  segmentedContainer: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#F0F0F0',
    borderRadius: SIZES.radius,
    padding: 4,
    marginBottom: 24,
    position: 'relative',
  },
  activeSegment: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius - 2,
    ...SHADOWS.light,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.oliveDark,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: SIZES.medium,
  },
  registerBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    marginTop: 10,
    marginBottom: 24,
  },
  registerBtnText: {
    color: COLORS.oliveDark,
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: COLORS.textLight,
    fontSize: SIZES.font,
  },
  loginLink: {
    color: COLORS.olive,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  }
});

