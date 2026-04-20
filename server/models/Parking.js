import mongoose from "mongoose";

const { Schema, model } = mongoose;

const parkingSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    address: String,
    description: { type: String, default: '' },

    totalSlots: {
      type: Number,
      required: true,
    },
    availableSlots: {
      type: Number,
      required: true,
    },

    pricePerHour: {
      type: Number,
      required: true,
    },

    vehicleType: [
      {
        type: String,
        enum: ["car", "bike"],
      },
    ],

    // New Fields
    spots: [
      {
        spotName: String,
        vehicleType: { type: String, enum: ["car", "bike"] },
        isOccupied: { type: Boolean, default: false },
      },
    ],
    startTime: {
      type: String,
      default: "00:00",
    },
    endTime: {
      type: String,
      default: "23:59",
    },
    images: [
      {
        type: String,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
    amenities: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

// 🔥 Geo Index (VERY IMPORTANT for $near queries)
parkingSchema.index({ location: "2dsphere" });

// ✅ Pre-save validation: availableSlots must not exceed totalSlots
parkingSchema.pre("save", async function () {
  if (this.availableSlots > this.totalSlots) {
    throw new Error("availableSlots cannot exceed totalSlots");
  }
});

export default model("Parking", parkingSchema);
