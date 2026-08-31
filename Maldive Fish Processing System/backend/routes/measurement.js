import express from 'express';
import { Measurement } from '../models/Measurement.js';

const router = express.Router();

// POST: Create a new measurement
router.post('/', async (req, res) => {
  try {
    const {
      sessionId,
      batchId,
      readingType,
      value,
      unit,
      status,
      notes,
      location,
    } = req.body;

    // Validate required fields
    if (!sessionId || !batchId || !readingType || value === undefined || !unit) {
      return res.status(400).json({
        message: 'sessionId, batchId, readingType, value, and unit are required',
      });
    }

    const measurement = await Measurement.create({
      sessionId,
      batchId,
      readingType,
      value,
      unit,
      status: status || 'normal',
      notes,
      location,
    });

    res.status(201).json({
      message: 'Measurement recorded successfully',
      measurement,
    });
  } catch (error) {
    console.error('Error creating measurement:', error);
    res.status(500).json({
      message: 'Error creating measurement',
      error: error.message,
    });
  }
});

// GET: Get all measurements for a batch
router.get('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const measurements = await Measurement.find({ batchId })
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      message: 'Measurements retrieved successfully',
      count: measurements.length,
      measurements,
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({
      message: 'Error fetching measurements',
      error: error.message,
    });
  }
});

// GET: Get all measurements for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const measurements = await Measurement.find({ sessionId })
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      message: 'Session measurements retrieved successfully',
      count: measurements.length,
      measurements,
    });
  } catch (error) {
    console.error('Error fetching session measurements:', error);
    res.status(500).json({
      message: 'Error fetching session measurements',
      error: error.message,
    });
  }
});

// GET: Get all measurements with optional filtering
router.get('/', async (req, res) => {
  try {
    const { batchId, sessionId, readingType, limit = 100, skip = 0 } = req.query;
    const filter = {};

    if (batchId) filter.batchId = batchId;
    if (sessionId) filter.sessionId = sessionId;
    if (readingType) filter.readingType = readingType;

    const measurements = await Measurement.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Measurement.countDocuments(filter);

    res.json({
      message: 'Measurements retrieved successfully',
      total,
      count: measurements.length,
      measurements,
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({
      message: 'Error fetching measurements',
      error: error.message,
    });
  }
});

// GET: Get single measurement by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const measurement = await Measurement.findById(id).lean();

    if (!measurement) {
      return res.status(404).json({
        message: 'Measurement not found',
      });
    }

    res.json({
      message: 'Measurement retrieved successfully',
      measurement,
    });
  } catch (error) {
    console.error('Error fetching measurement:', error);
    res.status(500).json({
      message: 'Error fetching measurement',
      error: error.message,
    });
  }
});

// DELETE: Delete a measurement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const measurement = await Measurement.findByIdAndDelete(id);

    if (!measurement) {
      return res.status(404).json({
        message: 'Measurement not found',
      });
    }

    res.json({
      message: 'Measurement deleted successfully',
      measurement,
    });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    res.status(500).json({
      message: 'Error deleting measurement',
      error: error.message,
    });
  }
});

// DELETE: Delete all measurements for a session
router.delete('/session/:sessionId/all', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await Measurement.deleteMany({ sessionId });

    res.json({
      message: 'Session measurements deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting session measurements:', error);
    res.status(500).json({
      message: 'Error deleting session measurements',
      error: error.message,
    });
  }
});

// PUT: Update a measurement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const measurement = await Measurement.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!measurement) {
      return res.status(404).json({
        message: 'Measurement not found',
      });
    }

    res.json({
      message: 'Measurement updated successfully',
      measurement,
    });
  } catch (error) {
    console.error('Error updating measurement:', error);
    res.status(500).json({
      message: 'Error updating measurement',
      error: error.message,
    });
  }
});

export default router;
