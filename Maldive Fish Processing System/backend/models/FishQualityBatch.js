import mongoose from "mongoose";

const fishQualityBatchSchema = new mongoose.Schema(
  {
    imageName: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    qualityClass: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
    probabilities: {
      type: Map,
      of: Number,
      default: {},
    },
    status: {
      type: String,
      required: true,
    },
    rawClass: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    voc: {
      type: Number,
      required: true,
    },
    odorStatus: {
      type: String,
      required: true,
    },
    storageAdvice: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const FishQualityBatch = mongoose.model(
  "FishQualityBatch",
  fishQualityBatchSchema,
);
export default FishQualityBatch;
