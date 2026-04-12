import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getOwnerBookings,
  getOwnerAnalytics
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/booking/create
router.post("/create", protect, createBooking);

// GET /api/booking/my-bookings
router.get("/my-bookings", protect, getMyBookings);

// GET /api/booking/:bookingId
router.get("/:bookingId", protect, getBookingById);

// PUT /api/booking/:bookingId/cancel
router.put("/:bookingId/cancel", protect, cancelBooking);

// GET /api/booking/owner/bookings
router.get("/owner/bookings", protect, getOwnerBookings);

// GET /api/booking/owner/analytics
router.get("/owner/analytics", protect, getOwnerAnalytics);

export default router;
