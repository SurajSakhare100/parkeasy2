import mongoose from "mongoose";

const { Schema, model } = mongoose;

const analyticsSchema = new Schema(
  {
    parkingId: {
      type: Schema.Types.ObjectId,
      ref: "Parking",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    totalBookings: {
      type: Number,
      default: 0,
    },

    revenue: {
      type: Number,
      default: 0,
    },

    peakHour: Number, // 0–23
  },
  { timestamps: true }
);

// Compound index for efficient daily analytics queries per parking
analyticsSchema.index({ parkingId: 1, date: 1 });

export default model("Analytics", analyticsSchema);
