import express from 'express';
import { RawFishQuality } from '../models/RawFishQuality.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      batchId,
      species,
      source,
      analysisDate,
      freshnessScore,
      qualityLabel,
      assessment,
      imageName,
    } = req.body;

    if (!batchId || !species || !assessment) {
      return res.status(400).json({
        message: 'batchId, species, and assessment are required',
      });
    }

    const rawFishRecord = await RawFishQuality.create({
      batchId,
      species,
      source,
      analysisDate: analysisDate ? new Date(analysisDate) : undefined,
      freshnessScore,
      qualityLabel,
      assessment,
      imageName,
    });

    res.status(201).json(rawFishRecord);
  } catch (error) {
    console.error('Raw fish save error:', error);
    res.status(500).json({ message: 'Unable to save raw fish assessment' });
  }
});

router.get('/', async (req, res) => {
  try {
    const records = await RawFishQuality.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(records);
  } catch (error) {
    console.error('Fetch raw fish history error:', error);
    res.status(500).json({ message: 'Unable to fetch raw fish history' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await RawFishQuality.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete raw fish assessment error:', error);
    res.status(500).json({ message: 'Unable to delete assessment' });
  }
});

export default router;
