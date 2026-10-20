import mongoose from 'mongoose';

const dryFishBatchSchema = new mongoose.Schema(
  {
    batchCode: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    loadCell: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
    initialWeight: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currentWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    temp: {
      type: Number,
      default: 0,
      min: 0,
    },
    quality: {
      type: String,
      default: 'Grade A',
      trim: true,
    },
    initialMoisture: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    targetMoisture: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    moistureTrend: {
      type: [Number],
      default: [],
    },
    status: {
      type: String,
      enum: ['drying', 'complete', 'pending'],
      default: 'drying',
    },
  },
  { timestamps: true }
);

dryFishBatchSchema.index({ batchCode: 1 }, { unique: true, sparse: true });

export default mongoose.model('DryFishBatch', dryFishBatchSchema);
