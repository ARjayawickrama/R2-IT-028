import mongoose from 'mongoose';

const inventoryBatchSchema = new mongoose.Schema({
  batchCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  fishType: {
    type: String,
    default: 'Skipjack Tuna (Balaya)',
  },
  supplier: {
    type: String,
    default: 'Local Fisheries Harbor',
  },
  initialRawWeightKg: {
    type: Number,
    required: true,
    min: 0,
  },
  dressedWeightKg: {
    type: Number,
    default: 0,
  },
  saltUsedKg: {
    type: Number,
    default: 0,
  },
  boilingDate: {
    type: Date,
  },
  boilingDurationMinutes: {
    type: Number,
    default: 0,
  },
  dryingStartDate: {
    type: Date,
  },
  dryingEndDate: {
    type: Date,
  },
  currentMoisturePercentage: {
    type: Number,
    default: 70, // raw starts around 70-75% moisture
  },
  targetMoistureAchieved: {
    type: Boolean,
    default: false,
  },
  finalYield: {
    gradeA_Kg: { type: Number, default: 0 },
    gradeB_Kg: { type: Number, default: 0 },
    gradeC_Kg: { type: Number, default: 0 },
    rihaakuruLiters: { type: Number, default: 0 },
    totalOutputKg: { type: Number, default: 0 },
    yieldPercentage: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: [
      'RAW_RECEIVED',
      'CLEANED',
      'BOILED',
      'DRYING',
      'QUALITY_GRADED',
      'PACKAGED',
      'COMPLETED',
    ],
    default: 'RAW_RECEIVED',
  },
  notes: {
    type: String,
    default: '',
  },
  createdBy: {
    type: String,
    default: 'System Admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

inventoryBatchSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  // Auto-calculate yield % if total output exists
  if (this.finalYield.totalOutputKg > 0 && this.initialRawWeightKg > 0) {
    this.finalYield.yieldPercentage = parseFloat(
      ((this.finalYield.totalOutputKg / this.initialRawWeightKg) * 100).toFixed(2)
    );
  }
  next();
});

const InventoryBatch = mongoose.model('InventoryBatch', inventoryBatchSchema);

export default InventoryBatch;
