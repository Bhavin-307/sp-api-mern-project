import mongoose from "mongoose";

const feedJobSchema = new mongoose.Schema(
  {
    feedId: { type: String, index: true },
    processingStatus: { type: String, default: "IN_QUEUE" },
    inputCount: Number,
    marketplaceId: String,
    resultDocumentId: String,
  },
  { timestamps: true }
);

export const FeedJob = mongoose.model("FeedJob", feedJobSchema);
