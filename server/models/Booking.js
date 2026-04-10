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
      enum: ["booked", "active", "completed", "cancelled"],
      default: "booked",
      index: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },

    qrCode: {
      type: String, // store QR string/token
      required: true,
      unique: true,
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

export default model("Booking", bookingSchema);
