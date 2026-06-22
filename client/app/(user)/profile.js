import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../theme';
import userService from '../../services/userService';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        fetchProfile();
      }
    };
    checkToken();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setUser(data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    import('react-native').then(({ DeviceEventEmitter }) => {
        DeviceEventEmitter.emit('auth_error');
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      </View>

      <View style={styles.container}>
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#3D3D3D' : COLORS.badgeBg }]}>
            <Ionicons name="person" size={50} color={isDarkMode ? '#CCCCCC' : COLORS.olive} />
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.userEmail, { color: theme.textLight }]}>{user?.email}</Text>
          {user?.phone ? <Text style={[styles.userPhone, { color: theme.textLight }]}>{user?.phone}</Text> : null}
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionItem, { borderBottomColor: theme.border }]}
            onPress={() => router.push('/(user)/settings')}
          >
            <View style={[styles.optionIconContainer, { backgroundColor: isDarkMode ? '#3D3D3D' : COLORS.badgeBg }]}>
              <Ionicons name="settings-outline" size={20} color={isDarkMode ? '#FBD427' : COLORS.oliveDark} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.border }]}>
            <View style={[styles.optionIconContainer, { backgroundColor: isDarkMode ? '#3D3D3D' : COLORS.badgeBg }]}>
              <Ionicons name="help-circle-outline" size={20} color={isDarkMode ? '#FBD427' : COLORS.oliveDark} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.oliveDark} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: '#4C4223',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 100, 
  },
  profileCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  userPhone: {
    fontSize: SIZES.font,
    color: COLORS.textLight,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontWeight: 'bold',
    fontSize: SIZES.medium,
    color: COLORS.oliveDark,
  },
});
