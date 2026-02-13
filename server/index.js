import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDb, { ensureVectorIndex } from './config/db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import bookRoutes from './routes/books.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'https://mastewal-one.vercel.app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDb();
await ensureVectorIndex();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));

if (process.env.LOG_MEMORY === 'true') {
  app.use((req, res, next) => {
    const usage = process.memoryUsage();
    console.log(
      `[MEMORY] rss=${Math.round(usage.rss / 1024 / 1024)}MB heapUsed=${Math.round(
        usage.heapUsed / 1024 / 1024
      )}MB`
    );
    next();
  });
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount API routes under /api to match frontend expectations
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

