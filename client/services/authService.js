import api from './api';

const authService = {
  /**
   * Register a new user
   */
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  /**
   * Login with email and password
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Send OTP to phone number
   */
  sendOtp: async (phone) => {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  },

  /**
   * Verify OTP
   */
  verifyOtp: async (phone, otp, name, role, vehicleType) => {
    const response = await api.post('/auth/verify-otp', { 
      phone, 
      otp, 
      name, 
      role, 
      vehicleType 
    });
    return response.data;
  },
};

export default authService;
