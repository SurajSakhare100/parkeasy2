import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
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
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/authService';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  // const [email, setEmail] = useState(''); // Commented down email field
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client'); // default role
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }



    setLoading(true);
    try {
      // Call actual backend login using phone, password, and role
      const data = await authService.login(phone, password, role);

      const { token, user } = data;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      if (role === 'owner') {
        router.replace('/(owner)/home');
      } else {
        router.replace('/(user)/my-bookings');
      }

    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior="height"
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

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'client' && styles.roleBtnActive]}
                onPress={() => setRole('client')}
              >
                <Text style={[styles.roleText, role === 'client' && styles.roleTextActive]}>Client</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'owner' && styles.roleBtnActive]}
                onPress={() => setRole('owner')}
              >
                <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>Owner</Text>
              </TouchableOpacity>
            </View>

            {/* Commented out email input
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
            */}

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
    backgroundColor: COLORS.white,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.oliveDark,
    marginTop: 15,
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
    marginBottom: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundLight,
    padding: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: SIZES.radius - 4,
  },
  roleBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  roleText: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  roleTextActive: {
    color: COLORS.oliveDark,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 15,
    marginBottom: 16,
    height: 56,
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
    marginBottom: 24,
  },
  forgotText: {
    color: COLORS.olive,
    fontWeight: '600',
    fontSize: SIZES.font,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: SIZES.radius,
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
