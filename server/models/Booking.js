import mongoose from "mongoose";

const { Schema, model } = mongoose;

const bookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parkingId: {
      type: Schema.Types.ObjectId,
      ref: "Parking",
      required: true,
      index: true,
    },

    vehicleType: {
      type: String,
      enum: ["car", "bike"],
      required: true,
    },
    spotName: {
      type: String,
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending_payment", "booked", "active", "completed", "cancelled"],
      default: "pending_payment",
      index: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },

    qrCode: {
      type: String, // store QR token string
      // created after payment is completed
    },

    qrCodeImage: {
      type: String, // Cloudinary secure URL of the QR image
    },

    qrScanUrl: {
      type: String, // actual QR payload URL for scanning
    },

    entryTime: Date,
    exitTime: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ✅ Compound index to prevent double booking
bookingSchema.index({ parkingId: 1, startTime: 1, endTime: 1 });

// ✅ Virtual: booking duration in hours
bookingSchema.virtual("duration").get(function () {
  return (this.endTime - this.startTime) / (1000 * 60 * 60);
});

// ✅ Method: check if booking is currently active
bookingSchema.methods.isActiveNow = function () {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
};

const Booking = model("Booking", bookingSchema);

// Ensure a sparse unique index on qrCode so multiple bookings without a qrCode
// (created before payment) do not conflict. If an older non-sparse unique index
// exists (from previous schema), drop it and recreate a sparse unique index.
(async () => {
  try {
    const idxs = await Booking.collection.indexes();
    const hasNonSparse = idxs.some(i => i.key && i.key.qrCode === 1 && !i.sparse);
    if (hasNonSparse) {
      try {
        await Booking.collection.dropIndex('qrCode_1');
      } catch (e) {
        // ignore drop errors
      }
    }
    // Create sparse unique index (idempotent if already exists)
    await Booking.collection.createIndex({ qrCode: 1 }, { unique: true, sparse: true });
  } catch (err) {
    console.error('Failed to ensure qrCode sparse unique index:', err);
  }
})();

export default Booking;
