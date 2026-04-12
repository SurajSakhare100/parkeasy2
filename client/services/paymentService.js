import api from './api';

const paymentService = {
  /**
   * Create a Razorpay order for a booking
   * Returns { orderId, amount, currency, key, paymentId, bookingDetails }
   */
  createOrder: async (bookingId) => {
    const res = await api.post('/payment/create-order', { bookingId });
    return res.data;
  },

  /**
   * Verify payment signature after successful Razorpay checkout
   */
  verifyPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }) => {
    const res = await api.post('/payment/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    });
    return res.data;
  },
};

export default paymentService;
