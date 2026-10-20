import express from 'express';
import mongoose from 'mongoose';
import DryFishBatch from '../models/DryFishBatch.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/batches', async (req, res) => {
  try {
    const batches = await DryFishBatch.find().sort({ createdAt: -1 }).lean();
    res.json(batches);
  } catch (error) {
    console.error('Error fetching dry-fish batches:', error);
    res.status(500).json({ message: 'Error fetching dry-fish batches' });
  }
});

router.post('/batches', async (req, res) => {
  try {
    const {
      batchCode,
      name,
      loadCell,
      initialWeight,
      currentWeight,
      temp,
      quality,
      initialMoisture,
      targetMoisture,
      moistureTrend,
      status,
    } = req.body;

    const batch = await DryFishBatch.create({
      batchCode,
      name,
      loadCell,
      initialWeight,
      currentWeight,
      temp,
      quality,
      initialMoisture,
      targetMoisture,
      moistureTrend,
      status,
    });

    res.status(201).json(batch);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error creating dry-fish batch:', error);
    res.status(500).json({ message: 'Error creating dry-fish batch' });
  }
});

router.patch('/batches/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid dry-fish batch ID' });
  }

  const allowedFields = [
    'loadCell',
    'currentWeight',
    'temp',
    'quality',
    'initialMoisture',
    'targetMoisture',
    'moistureTrend',
    'status',
  ];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No supported batch fields provided' });
  }

  try {
    const batch = await DryFishBatch.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!batch) {
      return res.status(404).json({ message: 'Dry-fish batch not found' });
    }

    res.json(batch);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error updating dry-fish batch:', error);
    res.status(500).json({ message: 'Error updating dry-fish batch' });
  }
});

router.delete('/batches', async (req, res) => {
  try {
    const result = await DryFishBatch.deleteMany({});
    res.json({
      message: 'Dry-fish batches deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting dry-fish batches:', error);
    res.status(500).json({ message: 'Error deleting dry-fish batches' });
  }
});

export default router;
