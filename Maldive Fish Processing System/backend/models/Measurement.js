import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      trim: true,
    },
    batchId: {
      type: String,
      required: [true, 'Batch ID is required'],
      trim: true,
    },
    readingType: {
      type: String,
      enum: ['temperature', 'salinity', 'ph', 'boiling', 'mechanical', 'measurement'],
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Measurement value is required'],
    },
    unit: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical'],
      default: 'normal',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
measurementSchema.index({ batchId: 1, timestamp: -1 });
measurementSchema.index({ sessionId: 1 });
measurementSchema.index({ createdAt: -1 });

export const Measurement = mongoose.model('Measurement', measurementSchema);
