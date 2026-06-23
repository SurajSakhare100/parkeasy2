import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import OTP from "../models/OTP.js";

// Helper for 2Factor OTP sending
async function sendOtpHelper(phone) {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!apiKey) throw new Error("TWO_FACTOR_API_KEY is missing in environment");
  
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/+91${phone}/AUTOGEN`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== "Success") {
    throw new Error(data.Details || "Failed to send OTP");
  }
  return data.Details; // sessionId
}

// Helper for 2Factor OTP verification
async function verifyOtpHelper(sessionId, otp) {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.Status === "Success" && data.Details === "OTP Matched";
}

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ─── Controller Methods ──────────────────────────────────────────────────────

/**
 * Register User (Email/Password)
 */
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, otp } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }
    if (!otp) {
      return res.status(400).json({ message: "OTP is required for registration" });
    }

    // Check if user exists
    let existingUserQuery = [];
    if (email) existingUserQuery.push({ email });
    if (phone) existingUserQuery.push({ phone });

    const existingUser = await User.findOne({ $or: existingUserQuery });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email or phone already exists" });
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({ phone });
    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    const isValid = await verifyOtpHelper(otpDoc.sessionId, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await OTP.deleteMany({ phone });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userData = {
      name,
      password: hashedPassword,
      role: role || "customer",
      isVerified: true, // Email/Phone registration assumed verified for now or separate flow
    };
    if (email) userData.email = email;
    if (phone) userData.phone = phone;

    const user = await User.create(userData);

    console.log(`User registered: ${email}`);
    res.status(201).json({ message: "Registration successful", userId: user._id });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

/**
 * Login User (Email/Password)
 */
export const login = async (req, res) => {
  try {
    const { email, phone, password, role } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ message: "Email/Phone and password are required" });
    }

    // Find user
    const query = phone ? { phone } : { email };
    
    // Optionally narrow by role if enforced
    // if (role) query.role = role;

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate Token
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

/**
 * Send OTP (Phone)
 */
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const sessionId = await sendOtpHelper(phone);

    await OTP.deleteMany({ phone });
    await OTP.create({
      phone,
      sessionId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

/**
 * Verify OTP (Phone)
 */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name, role, vehicleType } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const otpDoc = await OTP.findOne({ phone });
    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    const isValid = await verifyOtpHelper(otpDoc.sessionId, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await OTP.deleteMany({ phone });

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        name: name || "",
        role: role || "customer",
        vehicleType: vehicleType || [],
        isVerified: true,
      });
    } else {
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error during verification", error: error.message });
  }
};
