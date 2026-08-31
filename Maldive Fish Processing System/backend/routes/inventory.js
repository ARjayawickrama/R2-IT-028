import express from 'express';
import InventoryItem from '../models/InventoryItem.js';
import InventoryBatch from '../models/InventoryBatch.js';
import StockTransaction from '../models/StockTransaction.js';

const router = express.Router();

// Default seed inventory catalog for Maldive Fish processing
const DEFAULT_ITEMS = [
  {
    sku: 'RAW-TUNA-01',
    name: 'Fresh Skipjack Tuna (Balaya)',
    category: 'RAW_FISH',
    unit: 'kg',
    currentStock: 450,
    reorderLevel: 100,
    unitCost: 750,
    storageLocation: 'Cold Storage Room 1 (-4°C)',
    grade: 'Premium',
    notes: 'Primary raw material for Maldive fish processing',
  },
  {
    sku: 'RAW-TUNA-02',
    name: 'Fresh Yellowfin Tuna (Kelawalla)',
    category: 'RAW_FISH',
    unit: 'kg',
    currentStock: 220,
    reorderLevel: 80,
    unitCost: 1200,
    storageLocation: 'Cold Storage Room 1 (-4°C)',
    grade: 'Premium',
    notes: 'High-grade large tuna processing',
  },
  {
    sku: 'SALT-SEA-01',
    name: 'Solar Coarse Sea Salt',
    category: 'SALT',
    unit: 'kg',
    currentStock: 350,
    reorderLevel: 50,
    unitCost: 95,
    storageLocation: 'Dry Chemical/Salt Store',
    grade: 'Standard',
    notes: 'Used for boiling vats & brine preparation',
  },
  {
    sku: 'PKG-VAC-250',
    name: '250g Vacuum Barrier Pouches',
    category: 'PACKAGING',
    unit: 'packets',
    currentStock: 1200,
    reorderLevel: 250,
    unitCost: 18,
    storageLocation: 'Packaging Warehouse Shelf A',
    grade: 'N/A',
    notes: 'Airtight packaging for retail export',
  },
  {
    sku: 'PKG-VAC-500',
    name: '500g Vacuum Barrier Pouches',
    category: 'PACKAGING',
    unit: 'packets',
    currentStock: 850,
    reorderLevel: 200,
    unitCost: 26,
    storageLocation: 'Packaging Warehouse Shelf A',
    grade: 'N/A',
    notes: 'Commercial retail packaging',
  },
  {
    sku: 'FIN-MDF-GRA',
    name: 'Maldive Fish - Grade A (Glassy Solid Pieces)',
    category: 'FINISHED_MALDIVE_FISH',
    unit: 'kg',
    currentStock: 85,
    reorderLevel: 25,
    unitCost: 4200,
    storageLocation: 'Finished Goods Dehumidified Store',
    grade: 'Grade A',
    notes: 'Dark mahogany color, glass fracture, <12% moisture',
  },
  {
    sku: 'FIN-MDF-GRB',
    name: 'Maldive Fish - Grade B (Standard Cuts)',
    category: 'FINISHED_MALDIVE_FISH',
    unit: 'kg',
    currentStock: 48,
    reorderLevel: 20,
    unitCost: 3400,
    storageLocation: 'Finished Goods Dehumidified Store',
    grade: 'Grade B',
    notes: 'Standard quality, firm texture',
  },
  {
    sku: 'FIN-MDF-GRC',
    name: 'Maldive Fish - Grade C (Cooking Flakes/Chips)',
    category: 'FINISHED_MALDIVE_FISH',
    unit: 'kg',
    currentStock: 30,
    reorderLevel: 15,
    unitCost: 2600,
    storageLocation: 'Finished Goods Dehumidified Store',
    grade: 'Grade C',
    notes: 'Small chips and flakes for ground processing',
  },
  {
    sku: 'EXT-RIHAA-01',
    name: 'Rihaakuru Fish Paste/Extract',
    category: 'BY_PRODUCT',
    unit: 'liters',
    currentStock: 42,
    reorderLevel: 10,
    unitCost: 1800,
    storageLocation: 'Extract Bottling Section',
    grade: 'Standard',
    notes: 'Boiled down concentrated tuna stock extract',
  },
];

// Helper to seed initial items if empty
const autoSeedIfEmpty = async () => {
  const count = await InventoryItem.countDocuments();
  if (count === 0) {
    await InventoryItem.insertMany(DEFAULT_ITEMS);
    console.log('Seeded default Maldive Fish inventory items.');

    // Also seed a couple of sample production batches if empty
    const batchCount = await InventoryBatch.countDocuments();
    if (batchCount === 0) {
      await InventoryBatch.create([
        {
          batchCode: 'MF-BATCH-2026-0801',
          fishType: 'Skipjack Tuna (Balaya)',
          supplier: 'Mirissa Fishery Harbor',
          initialRawWeightKg: 200,
          dressedWeightKg: 155,
          saltUsedKg: 24,
          boilingDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          boilingDurationMinutes: 110,
          dryingStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          currentMoisturePercentage: 18,
          status: 'DRYING',
          notes: 'Drying stage day 3. Salt level 12%.',
        },
        {
          batchCode: 'MF-BATCH-2026-0728',
          fishType: 'Skipjack Tuna (Balaya)',
          supplier: 'Beruwala Harbor',
          initialRawWeightKg: 300,
          dressedWeightKg: 230,
          saltUsedKg: 36,
          boilingDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          boilingDurationMinutes: 120,
          dryingStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          dryingEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          currentMoisturePercentage: 11.5,
          targetMoistureAchieved: true,
          finalYield: {
            gradeA_Kg: 38,
            gradeB_Kg: 14,
            gradeC_Kg: 6,
            rihaakuruLiters: 9,
            totalOutputKg: 58,
            yieldPercentage: 19.33,
          },
          status: 'QUALITY_GRADED',
          notes: 'AI Model evaluated 65.5% Grade A distribution. Moisture target verified.',
        },
      ]);
    }
  }
};

// 1. GET SUMMARY
router.get('/summary', async (req, res) => {
  try {
    await autoSeedIfEmpty();

    const items = await InventoryItem.find().sort({ updatedAt: -1 });
    const batches = await InventoryBatch.find().sort({ createdAt: -1 });
    const transactions = await StockTransaction.find().sort({ createdAt: -1 }).limit(10);

    const lowStockItems = items.filter((item) => item.currentStock <= item.reorderLevel);

    const rawFishStockKg = items
      .filter((i) => i.category === 'RAW_FISH')
      .reduce((acc, i) => acc + i.currentStock, 0);

    const saltStockKg = items
      .filter((i) => i.category === 'SALT')
      .reduce((acc, i) => acc + i.currentStock, 0);

    const finishedMaldiveFishKg = items
      .filter((i) => i.category === 'FINISHED_MALDIVE_FISH')
      .reduce((acc, i) => acc + i.currentStock, 0);

    const activeBatchesCount = batches.filter(
      (b) => !['PACKAGED', 'COMPLETED'].includes(b.status)
    ).length;

    // Calculate average yield % across completed batches
    const completedBatches = batches.filter((b) => b.finalYield?.yieldPercentage > 0);
    const avgYieldPercentage =
      completedBatches.length > 0
        ? parseFloat(
            (
              completedBatches.reduce((acc, b) => acc + b.finalYield.yieldPercentage, 0) /
              completedBatches.length
            ).toFixed(2)
          )
        : 18.5; // typical baseline

    res.json({
      success: true,
      data: {
        rawFishStockKg,
        saltStockKg,
        finishedMaldiveFishKg,
        activeBatchesCount,
        totalItemsCount: items.length,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        avgYieldPercentage,
        recentTransactions: transactions,
      },
    });
  } catch (error) {
    console.error('Inventory summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET ALL ITEMS
router.get('/items', async (req, res) => {
  try {
    await autoSeedIfEmpty();
    const { category, search } = req.query;

    let query = {};
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { storageLocation: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await InventoryItem.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CREATE ITEM
router.post('/items', async (req, res) => {
  try {
    const newItem = new InventoryItem(req.body);
    await newItem.save();

    // Log transaction
    await StockTransaction.create({
      transactionType: 'STOCK_IN',
      itemSku: newItem.sku,
      itemName: newItem.name,
      category: newItem.category,
      quantity: newItem.currentStock,
      unit: newItem.unit,
      previousStock: 0,
      newStock: newItem.currentStock,
      reason: 'Initial catalog creation',
      performedBy: req.body.performedBy || 'System Admin',
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 4. UPDATE ITEM
router.put('/items/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 5. DELETE ITEM
router.delete('/items/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. RECORD STOCK TRANSACTION (STOCK IN, STOCK OUT, ADJUSTMENT)
router.post('/transactions', async (req, res) => {
  try {
    const { itemSku, transactionType, quantity, reason, referenceInvoice, performedBy, batchCode } = req.body;

    const item = await InventoryItem.findOne({ sku: itemSku });
    if (!item) {
      return res.status(404).json({ success: false, message: `Item with SKU ${itemSku} not found` });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive quantity is required' });
    }

    const previousStock = item.currentStock;
    let newStock = previousStock;

    if (transactionType === 'STOCK_IN' || transactionType === 'PRODUCTION_YIELD') {
      newStock += qty;
    } else if (transactionType === 'STOCK_OUT' || transactionType === 'WIP_USAGE' || transactionType === 'ADJUSTMENT') {
      if (previousStock < qty && transactionType !== 'ADJUSTMENT') {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${previousStock} ${item.unit}, requested: ${qty}`,
        });
      }
      newStock = Math.max(0, previousStock - qty);
    }

    item.currentStock = newStock;
    item.updatedAt = new Date();
    await item.save();

    const transaction = await StockTransaction.create({
      transactionType,
      itemSku: item.sku,
      itemName: item.name,
      category: item.category,
      batchCode: batchCode || '',
      quantity: qty,
      unit: item.unit,
      previousStock,
      newStock,
      referenceInvoice: referenceInvoice || '',
      reason: reason || '',
      performedBy: performedBy || 'Operator',
    });

    res.status(201).json({
      success: true,
      data: {
        item,
        transaction,
      },
    });
  } catch (error) {
    console.error('Stock transaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. GET STOCK TRANSACTIONS HISTORY
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await StockTransaction.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. GET PRODUCTION BATCHES
router.get('/batches', async (req, res) => {
  try {
    await autoSeedIfEmpty();
    const batches = await InventoryBatch.find().sort({ createdAt: -1 });
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. CREATE NEW PRODUCTION BATCH
router.post('/batches', async (req, res) => {
  try {
    const { batchCode, fishType, supplier, initialRawWeightKg, saltUsedKg, rawSku, saltSku, performedBy, notes } = req.body;

    const rawWeight = Number(initialRawWeightKg);
    const saltWeight = Number(saltUsedKg) || 0;

    // Check if batch code already exists
    const existing = await InventoryBatch.findOne({ batchCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Batch ${batchCode} already exists` });
    }

    // Auto-deduct raw fish from stock if SKU provided
    if (rawSku && rawWeight > 0) {
      const rawItem = await InventoryItem.findOne({ sku: rawSku });
      if (rawItem && rawItem.currentStock >= rawWeight) {
        const prev = rawItem.currentStock;
        rawItem.currentStock -= rawWeight;
        await rawItem.save();

        await StockTransaction.create({
          transactionType: 'WIP_USAGE',
          itemSku: rawItem.sku,
          itemName: rawItem.name,
          category: rawItem.category,
          batchCode,
          quantity: rawWeight,
          unit: rawItem.unit,
          previousStock: prev,
          newStock: rawItem.currentStock,
          reason: `Consumed in new batch ${batchCode}`,
          performedBy: performedBy || 'Production Supervisor',
        });
      }
    }

    // Auto-deduct salt if SKU provided
    if (saltSku && saltWeight > 0) {
      const saltItem = await InventoryItem.findOne({ sku: saltSku });
      if (saltItem && saltItem.currentStock >= saltWeight) {
        const prev = saltItem.currentStock;
        saltItem.currentStock -= saltWeight;
        await saltItem.save();

        await StockTransaction.create({
          transactionType: 'WIP_USAGE',
          itemSku: saltItem.sku,
          itemName: saltItem.name,
          category: saltItem.category,
          batchCode,
          quantity: saltWeight,
          unit: saltItem.unit,
          previousStock: prev,
          newStock: saltItem.currentStock,
          reason: `Salt consumed in batch ${batchCode} boiling`,
          performedBy: performedBy || 'Production Supervisor',
        });
      }
    }

    const newBatch = new InventoryBatch({
      batchCode,
      fishType: fishType || 'Skipjack Tuna (Balaya)',
      supplier: supplier || 'Local Harbor',
      initialRawWeightKg: rawWeight,
      saltUsedKg: saltWeight,
      boilingDate: new Date(),
      status: 'RAW_RECEIVED',
      notes: notes || '',
      createdBy: performedBy || 'Operator',
    });

    await newBatch.save();
    res.status(201).json({ success: true, data: newBatch });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. ADVANCE PRODUCTION BATCH STAGE (Raw -> Cleaned -> Boiled -> Drying -> Graded -> Packaged)
router.put('/batches/:id/advance', async (req, res) => {
  try {
    const { nextStatus, currentMoisture, finalYield, notes, performedBy } = req.body;
    const batch = await InventoryBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    batch.status = nextStatus || batch.status;

    if (currentMoisture !== undefined) {
      batch.currentMoisturePercentage = Number(currentMoisture);
      if (batch.currentMoisturePercentage <= 15) {
        batch.targetMoistureAchieved = true;
      }
    }

    if (notes) {
      batch.notes = notes;
    }

    if (nextStatus === 'BOILED' && !batch.boilingDate) {
      batch.boilingDate = new Date();
      batch.boilingDurationMinutes = req.body.boilingDurationMinutes || 90;
    }

    if (nextStatus === 'DRYING' && !batch.dryingStartDate) {
      batch.dryingStartDate = new Date();
    }

    if (nextStatus === 'QUALITY_GRADED' || nextStatus === 'PACKAGED' || nextStatus === 'COMPLETED') {
      if (!batch.dryingEndDate) {
        batch.dryingEndDate = new Date();
      }

      if (finalYield) {
        const gradeA = Number(finalYield.gradeA_Kg) || 0;
        const gradeB = Number(finalYield.gradeB_Kg) || 0;
        const gradeC = Number(finalYield.gradeC_Kg) || 0;
        const rihaakuru = Number(finalYield.rihaakuruLiters) || 0;
        const total = gradeA + gradeB + gradeC;

        batch.finalYield = {
          gradeA_Kg: gradeA,
          gradeB_Kg: gradeB,
          gradeC_Kg: gradeC,
          rihaakuruLiters: rihaakuru,
          totalOutputKg: total,
          yieldPercentage:
            batch.initialRawWeightKg > 0 ? parseFloat(((total / batch.initialRawWeightKg) * 100).toFixed(2)) : 0,
        };

        // Auto-increment finished goods stock if requested
        if (req.body.creditFinishedStock) {
          const updates = [
            { sku: 'FIN-MDF-GRA', qty: gradeA },
            { sku: 'FIN-MDF-GRB', qty: gradeB },
            { sku: 'FIN-MDF-GRC', qty: gradeC },
            { sku: 'EXT-RIHAA-01', qty: rihaakuru },
          ];

          for (const u of updates) {
            if (u.qty > 0) {
              const finItem = await InventoryItem.findOne({ sku: u.sku });
              if (finItem) {
                const prev = finItem.currentStock;
                finItem.currentStock += u.qty;
                await finItem.save();

                await StockTransaction.create({
                  transactionType: 'PRODUCTION_YIELD',
                  itemSku: finItem.sku,
                  itemName: finItem.name,
                  category: finItem.category,
                  batchCode: batch.batchCode,
                  quantity: u.qty,
                  unit: finItem.unit,
                  previousStock: prev,
                  newStock: finItem.currentStock,
                  reason: `Finished yield output from batch ${batch.batchCode}`,
                  performedBy: performedBy || 'Quality Controller',
                });
              }
            }
          }
        }
      }
    }

    await batch.save();
    res.json({ success: true, data: batch });
  } catch (error) {
    console.error('Advance batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. GET SINGLE BATCH (FOR QR CODE / TRACEABILITY MODAL)
router.get('/batches/:id', async (req, res) => {
  try {
    const batch = await InventoryBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
