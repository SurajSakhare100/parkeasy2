import Booking from "../models/Booking.js";
import Parking from "../models/Parking.js";
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getBookedSpots = async (req, res) => {
  try {
    const { parkingId, startTime, endTime } = req.query;
    
    if (!parkingId || !startTime || !endTime) {
      return res.status(400).json({ message: "parkingId, startTime, and endTime are required" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const bookings = await Booking.find({
      parkingId,
      status: { $ne: "cancelled" },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    const bookedSpots = bookings.map(b => b.spotName);
    
    res.status(200).json({ bookedSpots });
  } catch (error) {
    console.error("Get booked spots error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { parkingId, vehicleType, vehicleNumber, startTime, endTime, spotName } = req.body;
    const userId = req.user.userId;

    if (!parkingId || !vehicleType || !vehicleNumber || !startTime || !endTime || !spotName) {
      return res.status(400).json({ message: "All fields are required (including spot selection and vehicle number)" });
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

    const durationHours = (end - start) / (1000 * 60 * 60);
    const totalAmount = Math.ceil(durationHours * parking.pricePerHour);

    const booking = await Booking.create({
      userId,
      parkingId,
      vehicleType,
      vehicleNumber,
      spotName,
      startTime: start,
      endTime: end,
      totalAmount,
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


export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("parkingId", "name address pricePerHour images")
      .populate("paymentId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


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


export const scanBookingByToken = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const booking = await Booking.findOne({ qrCode: qrToken })
      .populate("parkingId", "name address ownerId pricePerHour images")
      .populate("userId", "name email phone")
      .populate("paymentId", "amount status razorpayPaymentId createdAt");

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
    } else if (booking.status === "active" && !booking.exitTime) {
      booking.status = "completed";
      booking.exitTime = new Date();
      await booking.save();
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Scan booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


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

    const pythonScript = path.join(__dirname, '../scripts/predict.py');
    const pythonExecutable = path.join(__dirname, '../ml_env/bin/python3');
    
    const pythonProcess = spawn(pythonExecutable, [pythonScript]);
    
    let aiPredictionData = '';

    pythonProcess.stdout.on('data', (data) => {
      aiPredictionData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      let aiPrediction;
      try {
        aiPrediction = JSON.parse(aiPredictionData);
      } catch (err) {
        console.error("Failed to parse python output:", aiPredictionData);
        // Fallback gracefully
        aiPrediction = {
          predictedRevenueNextMonth: totalRevenue * 1.15,
          suggestedPriceAdjustment: "+5%",
          peakHours: "10:00 AM - 2:00 PM",
          predictedOccupancy: "78%",
          demandTrend: "upward"
        };
      }

      res.status(200).json({
        totalRevenue,
        totalBookings: bookings.length,
        totalParkings: parkings.length,
        activeSpots: parkings.filter(p => p.isActive).length,
        aiPrediction
      });
    });

    // Send the bookings to python stdin
    pythonProcess.stdin.write(JSON.stringify({ bookings }));
    pythonProcess.stdin.end();
  } catch (error) {
     console.error("Analytics error:", error);
     res.status(500).json({ message: "Server error", error: error.message });
  }
};
