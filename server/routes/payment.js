import express from "express";
import {
  createOrder,
  verifyPayment,
  getPaymentByBooking,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/payment/create-order
router.post("/create-order", protect, createOrder);

// POST /api/payment/verify
router.post("/verify", protect, verifyPayment);

// GET /api/payment/booking/:bookingId
router.get("/booking/:bookingId", protect, getPaymentByBooking);

export default router;
