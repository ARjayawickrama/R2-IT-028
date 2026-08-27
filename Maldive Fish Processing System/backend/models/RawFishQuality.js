import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    class: { type: String, required: true },
    confidence: { type: Number, required: true },
  },
  { _id: false }
);

const rawFishQualitySchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: [true, 'Batch ID is required'],
      trim: true,
    },
    species: {
      type: String,
      required: [true, 'Species is required'],
      trim: true,
    },
    source: {
      type: String,
      enum: ['upload', 'camera'],
      default: 'upload',
    },
    imageName: {
      type: String,
      trim: true,
    },
    analysisDate: {
      type: Date,
      default: Date.now,
    },
    freshnessScore: {
      type: Number,
      default: 0,
    },
    qualityLabel: {
      type: String,
      default: 'unknown',
      trim: true,
    },
    assessment: {
      total_detections: {
        type: Number,
        default: 0,
      },
      results: {
        type: [assessmentSchema],
        default: [],
      },
    },
  },
  { timestamps: true }
);

export const RawFishQuality = mongoose.model('RawFishQuality', rawFishQualitySchema);
