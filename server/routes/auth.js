import express from "express";
import { 
  register, 
  login, 
  sendOtp, 
  verifyOtp 
} from "../controllers/authController.js";

const router = express.Router();

// ─── Email/Password Routes ──────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password, role }
 */
router.post("/register", register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/login", login);


// ─── OTP Routes ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Body: { phone }
 */
router.post("/send-otp", sendOtp);

/**
 * POST /api/auth/verify-otp
 * Body: { phone, otp, name?, role?, vehicleType? }
 */
router.post("/verify-otp", verifyOtp);

export default router;
