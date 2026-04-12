import api from './api';

const bookingService = {
  /**
   * Create a new booking (returns bookingId + totalAmount)
   */
  createBooking: async ({ parkingId, vehicleType, startTime, endTime }) => {
    const res = await api.post('/booking/create', { parkingId, vehicleType, startTime, endTime });
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
};

export default bookingService;
