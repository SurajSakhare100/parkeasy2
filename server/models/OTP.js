import mongoose from "mongoose";

const { Schema, model } = mongoose;

const otpSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true, // 2factor.in session ID returned after sending OTP
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired docs
    },
  },
  { timestamps: true }
);

export default model("OTP", otpSchema);
