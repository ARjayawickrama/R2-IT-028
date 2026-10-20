import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import rawFishRoutes from './routes/rawFish.js';
import qualityRoutes from './routes/quality.js';
import inventoryRoutes from './routes/inventory.js';
import measurementRoutes from './routes/measurement.js';
import dryFishRoutes from './routes/dryFish.js';
import safetyRoutes from './routes/safety.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json({ limit: '4mb' }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/raw-fish', rawFishRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/dry-fish', dryFishRoutes);
app.use('/api/safety', safetyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start accepting requests only after MongoDB is ready.
const PORT = process.env.PORT || 5001;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
