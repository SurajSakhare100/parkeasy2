import mongoose from "mongoose";

const { Schema, model } = mongoose;

const searchHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Optional: Limit history per user or add index
searchHistorySchema.index({ userId: 1, createdAt: -1 });

export default model("SearchHistory", searchHistorySchema);
