import Booking from "../models/Booking.js";
import Parking from "../models/Parking.js";

/**
 * POST /api/booking/create
 * Creates a pending booking (before payment)
 * Body: { parkingId, vehicleType, startTime, endTime }
 */
export const createBooking = async (req, res) => {
  try {
    const { parkingId, vehicleType, startTime, endTime, spotName } = req.body;
    const userId = req.user.userId;

    if (!parkingId || !vehicleType || !startTime || !endTime || !spotName) {
      return res.status(400).json({ message: "All fields are required (including spot selection)" });
    }

    const parking = await Parking.findById(parkingId);
    if (!parking) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    // Calculate duration in hours and total amount
    const durationHours = (end - start) / (1000 * 60 * 60);
    const totalAmount = Math.ceil(durationHours * parking.pricePerHour);

    // Create booking with "pending" payment status initially
    const booking = await Booking.create({
      userId,
      parkingId,
      vehicleType,
      spotName,
      startTime: start,
      endTime: end,
      totalAmount,
      // QR code will be generated after successful payment
      status: "pending_payment",
    });

    res.status(201).json({
      message: "Booking created, proceed to payment",
      bookingId: booking._id,
      totalAmount,
      durationHours: Math.ceil(durationHours * 10) / 10,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error during booking", error: error.message });
  }
};

/**
 * GET /api/booking/my-bookings
 * Get all bookings for current user
 */
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const bookings = await Booking.find({ userId })
      .populate("parkingId", "name address pricePerHour images")
      .populate("paymentId", "amount status razorpayPaymentId")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * GET /api/booking/:bookingId
 * Get a single booking by ID (with QR code)
 */
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("parkingId", "name address pricePerHour images")
      .populate("paymentId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow owner to view
    if (booking.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * DELETE /api/booking/:bookingId/cancel
 * Cancel a booking (only if not yet active)
 */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status === "active" || booking.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel an active or completed booking" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * GET /api/booking/owner/bookings
 * Get owner bookings mapped to their parkings
 */
export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { filter } = req.query;

    const parkings = await Parking.find({ ownerId }).select('_id');
    const parkingIds = parkings.map(p => p._id);

    let dateQuery = {};
    const now = new Date();
    
    if (filter === 'today') {
      const startOfToday = new Date(now.setHours(0,0,0,0));
      dateQuery = { createdAt: { $gte: startOfToday } };
    } else if (filter === 'yesterday') {
      const startOfYesterday = new Date(new Date().setHours(0,0,0,0));
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(startOfYesterday);
      endOfYesterday.setDate(endOfYesterday.getDate() + 1);
      dateQuery = { createdAt: { $gte: startOfYesterday, $lt: endOfYesterday } };
    } else if (filter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateQuery = { createdAt: { $gte: startOfMonth } };
    }

    const bookings = await Booking.find({
      parkingId: { $in: parkingIds },
      ...dateQuery
    })
    .populate("parkingId", "name address")
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Owner bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * GET /api/booking/scan/:qrToken
 * Owner scans a booking QR token and gets booking details
 */
export const scanBookingByToken = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const booking = await Booking.findOne({ qrCode: qrToken })
      .populate("parkingId", "name address ownerId")
      .populate("userId", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.parkingId?.ownerId || booking.parkingId.ownerId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not authorized to access this booking" });
    }

    if (booking.status === "pending_payment") {
      return res.status(400).json({ message: "Booking payment is not completed yet" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "This booking has been cancelled" });
    }

    if (booking.status === "booked" && !booking.entryTime) {
      booking.status = "active";
      booking.entryTime = new Date();
      await booking.save();
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Scan booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * GET /api/booking/owner/analytics
 */
export const getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const parkings = await Parking.find({ ownerId });
    const parkingIds = parkings.map(p => p._id);
    
    const bookings = await Booking.find({ parkingId: { $in: parkingIds } });
    
    let totalRevenue = 0;
    bookings.forEach(b => {
      if (b.status !== 'cancelled') {
        totalRevenue += (b.totalAmount || 0);
      }
    });

    res.status(200).json({
      totalRevenue,
      totalBookings: bookings.length,
      totalParkings: parkings.length,
      activeSpots: parkings.filter(p => p.isActive).length
    });
  } catch (error) {
     console.error("Analytics error:", error);
     res.status(500).json({ message: "Server error", error: error.message });
  }
};
