import Razorpay from "razorpay";
import crypto from "crypto";
import QRCode from "qrcode";
import cloudinary from "../config/cloudinary.js";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";


const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });


export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("parkingId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const amountInPaise = Math.round(booking.totalAmount * 100);

    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        userId: req.user.userId.toString(),
      },
    });

    const payment = await Payment.create({
      bookingId,
      razorpayOrderId: order.id,
      amount: booking.totalAmount,
      status: "pending",
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
      bookingDetails: {
        parkingName: booking.parkingId.name,
        address: booking.parkingId.address,
        vehicleType: booking.vehicleType,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        totalAmount: booking.totalAmount,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create payment order", error: error.message });
  }
};


const sendBookingSms = async (phone, booking) => {
  try {
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey) {
      console.warn("TWO_FACTOR_API_KEY is missing in environment, skipping SMS");
      return;
    }
    if (!phone) {
      console.warn("No phone number found for user, skipping SMS");
      return;
    }

    const startTimeStr = new Date(booking.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const endTimeStr = new Date(booking.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = new Date(booking.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    const msg = `Your booking id ${booking.bookingId || booking._id} slot ${booking.spotName} is from ${startTimeStr} to ${endTimeStr} on ${dateStr}`;

    // 2Factor.in transactional SMS URL format
    const url = `https://2factor.in/API/V1/${apiKey}/ADDON_SERVICES/SEND/TSMS?From=PRKEZY&To=${phone}&Msg=${encodeURIComponent(msg)}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("SMS send response:", data);
  } catch (err) {
    console.error("Failed to send booking confirmation SMS:", err);
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "failed" }
      );
      await Booking.findByIdAndUpdate(bookingId, { status: "failed" });
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: "success",
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentId: payment._id,
        status: "booked",
      },
      { new: true }
    ).populate("parkingId").populate("userId");

    try {
      const qrToken = crypto.randomBytes(16).toString("hex");
      const qrScanUrl = `${process.env.QR_SCAN_URL_BASE || process.env.SERVER_URL || "https://parkeasy.example.com"}/api/booking/scan/${qrToken}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrScanUrl);
      const uploadResult = await cloudinary.uploader.upload(qrCodeDataUrl, {
        folder: "parkeasy/qrcodes",
        public_id: `qr_${qrToken}`,
        overwrite: true,
        resource_type: "image",
      });

      booking.qrCode = qrToken;
      booking.qrCodeImage = uploadResult.secure_url;
      booking.qrScanUrl = qrScanUrl;
      await booking.save();

      // Send confirmation SMS
      if (booking.userId && booking.userId.phone) {
        await sendBookingSms(booking.userId.phone, booking);
      }
    } catch (err) {
      console.error('QR generation/upload failed:', err);
      // Do not fail payment because QR upload failed; continue.
    }

    console.log(`Payment verified for booking: ${bookingId}`);

    res.status(200).json({
      message: "Payment verified successfully",
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        parkingName: booking.parkingId?.name,
        address: booking.parkingId?.address,
        vehicleType: booking.vehicleType,
        vehicleNumber: booking.vehicleNumber,
        spotName: booking.spotName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: payment.amount,
        qrCode: booking.qrCode,
        qrCodeImage: booking.qrCodeImage,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Payment verification server error", error: error.message });
  }
};

export const getPaymentByBooking = async (req, res) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
