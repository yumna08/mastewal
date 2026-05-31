import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import connectDb, { ensureVectorIndex } from './config/db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import bookRoutes from './routes/books.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const CLIENT_ORIGINS = [
  'https://mastewal-1.onrender.com',
  'https://mastewal-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= DB CONNECTION =================
await connectDb();
await ensureVectorIndex();

// ================= CORS =================
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      if (CLIENT_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked for origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ================= MIDDLEWARE =================
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

// ================= ROUTES =================
// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API routes (must come before static/fallback routes)
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);

// Upload files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../client/dist');
console.log('Frontend path:', frontendPath);
console.log('Frontend dist exists:', fs.existsSync(frontendPath));
if (fs.existsSync(frontendPath)) {
  console.log('Dist contents:', fs.readdirSync(frontendPath));
}

// Serve static files WITHOUT automatic 404 responses - use fallthrough to continue to next handler
app.use(express.static(frontendPath, { 
  maxAge: '1d',
  etag: false,
  index: false,  // Don't auto-serve index.html
  fallthrough: true,  // CRITICAL: fall through to next handler instead of 404
  extensions: ['html', 'js', 'css', 'json', 'png', 'jpg', 'gif', 'svg', 'woff', 'woff2']
}));

// Fallback to index.html for client-side routing (MUST be after static but this is our catch-all)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  
  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    console.log('Frontend dist files:', fs.existsSync(frontendPath) ? fs.readdirSync(frontendPath) : 'dist does not exist');
    
    // Fallback: serve a minimal HTML that loads from a CDN or shows error
    const fallbackHTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Mastewal Books</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      console.error('Frontend build missing. Server logs:', {
        dist_path: '${frontendPath}',
        dist_exists: ${fs.existsSync(frontendPath)},
        error: 'index.html not found'
      });
      document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif"><h1>⚠️ Frontend Build Missing</h1><p>The frontend application build was not found. This is a deployment configuration issue.</p><ul><li>Dist path: ${frontendPath}</li><li>Dist exists: ${fs.existsSync(frontendPath)}</li></ul></div>';
    </script>
  </body>
</html>`;
    return res.type('text/html').send(fallbackHTML);
  }
  
  console.log('Serving index.html for route:', req.path);
  res.sendFile(indexPath, (err) => {
    if (err && err.code !== 'EISDIR') {
      console.error('Error serving index.html for route', req.path + ':', err.message);
      if (!res.headersSent) {
        res.status(500).send('<h1>Error loading application</h1><pre>' + err.message + '</pre>');
      }
    }
  });
});

// ================= ERROR HANDLING =================
// This middleware only catches errors from route handlers, not missing routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ================= START SERVER =================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});