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
  DeviceEventEmitter,
  Animated,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/authService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default role
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation for role selector
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: role === 'customer' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }, [role]);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(phone, password, role);
      const { token, user } = data;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      DeviceEventEmitter.emit('auth_success', { token, user });

      if (role === 'owner') {
        router.replace('/(owner)/home');
      } else {
        router.replace('/(user)/user-home');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectorWidth = (width - 48 - 8) / 2; // (ScreenWidth - padding - innerPadding) / 2

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
            <Text style={styles.subtitle}>Find your spot with ease</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Login</Text>

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
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? 'Please wait...' : 'Login'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color={COLORS.oliveDark} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Register</Text>
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
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    marginTop: 15,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotText: {
    color: COLORS.olive,
    fontWeight: '600',
    fontSize: SIZES.font,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    marginBottom: 24,
  },
  loginBtnText: {
    color: COLORS.oliveDark,
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerText: {
    color: COLORS.textLight,
    fontSize: SIZES.font,
  },
  registerLink: {
    color: COLORS.olive,
    fontSize: SIZES.font,
    fontWeight: 'bold',
  }
});

