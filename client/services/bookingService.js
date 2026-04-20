import api from './api';

const bookingService = {
  /**
   * Create a new booking (returns bookingId + totalAmount)
   */
  createBooking: async ({ parkingId, vehicleType, startTime, endTime, spotName }) => {
    const res = await api.post('/booking/create', { parkingId, vehicleType, startTime, endTime, spotName });
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
};

export default bookingService;
