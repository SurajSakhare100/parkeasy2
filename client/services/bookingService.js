import api from './api';

const bookingService = {
  /**
   * Create a new booking (returns bookingId + totalAmount)
   */
  createBooking: async ({ parkingId, vehicleType, vehicleNumber, startTime, endTime, spotName }) => {
    const res = await api.post('/booking/create', { parkingId, vehicleType, vehicleNumber, startTime, endTime, spotName });
    return res.data;
  },

  /**
   * Get booked spots for a specific parking location and time range
   */
  getBookedSpots: async (parkingId, startTime, endTime) => {
    const res = await api.get(`/booking/booked-spots?parkingId=${parkingId}&startTime=${startTime}&endTime=${endTime}`);
    return res.data;
  },

  /**
   * Get all bookings for logged-in user
   */
  getMyBookings: async () => {
    const res = await api.get('/booking/my-bookings');
    return res.data;
  },

  /**
   * Get a single booking by ID
   */
  getBookingById: async (bookingId) => {
    const res = await api.get(`/booking/${bookingId}`);
    return res.data;
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId) => {
    const res = await api.put(`/booking/${bookingId}/cancel`);
    return res.data;
  },

  /**
   * Get all bookings for owner
   */
  getOwnerBookings: async (filter = '') => {
    const res = await api.get(`/booking/owner/bookings?filter=${filter}`);
    return res.data;
  },

  /**
   * Get analytics for owner
   */
  getOwnerAnalytics: async () => {
    const res = await api.get('/booking/owner/analytics');
    return res.data;
  },
  /**
   * Scan booking by QR token (owner)
   */
  scanByToken: async (qrToken) => {
    const res = await api.get(`/booking/scan/${qrToken}`);
    return res.data;
  },
};

export default bookingService;
