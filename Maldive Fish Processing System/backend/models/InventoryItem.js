import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'RAW_FISH',
      'SALT',
      'CONSUMABLE',
      'PACKAGING',
      'FINISHED_MALDIVE_FISH',
      'BY_PRODUCT',
      'FUEL',
    ],
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'liters', 'packets', 'units', 'cartons', 'bags'],
    default: 'kg',
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  reorderLevel: {
    type: Number,
    required: true,
    default: 10,
  },
  unitCost: {
    type: Number,
    default: 0,
  },
  storageLocation: {
    type: String,
    default: 'Main Storage',
  },
  notes: {
    type: String,
    default: '',
  },
  grade: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C', 'Standard', 'Premium', 'N/A'],
    default: 'N/A',
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

inventoryItemSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

export default InventoryItem;
