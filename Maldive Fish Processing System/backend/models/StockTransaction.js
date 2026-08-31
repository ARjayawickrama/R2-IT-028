import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    required: true,
    enum: [
      'STOCK_IN', // Purchase / Catch Intake
      'STOCK_OUT', // Sales / Dispatch
      'WIP_USAGE', // Raw materials used in boiling/production
      'PRODUCTION_YIELD', // Finished dried fish produced
      'ADJUSTMENT', // Damage / Inventory Correction
    ],
  },
  itemSku: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  batchCode: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'kg',
  },
  previousStock: {
    type: Number,
    default: 0,
  },
  newStock: {
    type: Number,
    default: 0,
  },
  referenceInvoice: {
    type: String,
    default: '',
  },
  reason: {
    type: String,
    default: '',
  },
  performedBy: {
    type: String,
    default: 'Operator',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);

export default StockTransaction;
