import express from "express";
import {
  getBookedSpots,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getOwnerBookings,
  scanBookingByToken,
  getOwnerAnalytics
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/booking/booked-spots
router.get("/booked-spots", protect, getBookedSpots);

// POST /api/booking/create
router.post("/create", protect, createBooking);

// GET /api/booking/my-bookings
router.get("/my-bookings", protect, getMyBookings);

// GET /api/booking/scan/:qrToken
router.get("/scan/:qrToken", protect, scanBookingByToken);

// GET /api/booking/:bookingId
router.get("/:bookingId", protect, getBookingById);

// PUT /api/booking/:bookingId/cancel
router.put("/:bookingId/cancel", protect, cancelBooking);

// GET /api/booking/owner/bookings
router.get("/owner/bookings", protect, getOwnerBookings);

// GET /api/booking/owner/analytics
router.get("/owner/analytics", protect, getOwnerAnalytics);

export default router;
