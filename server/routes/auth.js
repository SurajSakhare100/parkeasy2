import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";

const router = express.Router();


async function sendOtp(phone) {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== "Success") {
    throw new Error(data.Details || "Failed to send OTP");
  }

  return data.Details; // sessionId
}


async function verifyOtp(sessionId, otp) {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.Status === "Success" && data.Details === "OTP Matched";
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Body: { phone }
 * Sends an OTP to the given phone number via 2factor.in.
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Send OTP via 2factor.in and get session ID
    const sessionId = await sendOtp(phone);

    // Remove any existing OTP doc for this phone (avoid duplicates)
    await OTP.deleteMany({ phone });

    // Save new session (expires in 10 minutes)
    await OTP.create({
      phone,
      sessionId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to send OTP" });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { phone, otp, name?, role?, vehicleType? }
 * Verifies OTP, then Creates or logs in the user. Returns JWT.
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp, name, role = "customer", vehicleType = [] } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    // Find session in DB
    const otpDoc = await OTP.findOne({ phone });
    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new OTP." });
    }

    // Verify with 2factor.in
    const isValid = await verifyOtp(otpDoc.sessionId, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Cleanup OTP doc after successful verification
    await OTP.deleteMany({ phone });

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        name: name || "",
        role,
        vehicleType,
        isVerified: true,
      });
    } else {
      // Mark existing user as verified if not already
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    // Issue JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        vehicleType: user.vehicleType,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    return res.status(500).json({ message: "Server error during verification" });
  }
});

export default router;
