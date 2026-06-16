import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: auto-attach JWT token ───────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: log errors ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    let msg;
    try {
      msg = error?.response?.data || error?.message || String(error);
    } catch (e) {
      msg = String(error);
    }
    console.error('API Error:', msg);
    
    // Redirect to login if 401 Unauthorized
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      DeviceEventEmitter.emit('auth_error');
    }
    
    return Promise.reject(error);
  }
);

export default api;
