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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔥 Geo Index (VERY IMPORTANT for $near queries)
parkingSchema.index({ location: "2dsphere" });

// ✅ Pre-save validation: availableSlots must not exceed totalSlots
parkingSchema.pre("save", function (next) {
  if (this.availableSlots > this.totalSlots) {
    return next(new Error("availableSlots cannot exceed totalSlots"));
  }
  next();
});

export default model("Parking", parkingSchema);
