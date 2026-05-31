import express from 'express';
import multer from 'multer';
import { adminOnly } from '../middleware/auth.js';
import Book from '../models/Book.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { extractTextFromFile, cleanText, chunkText, getUploadsDir } from '../services/text.js';
import { embedDocumentText } from '../services/embeddings.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, getUploadsDir());
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^\w.\-]+/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF and DOCX files are allowed'));
    }
    cb(null, true);
  }
});

router.use(adminOnly);

const BOOK_FIELDS = [
  'title',
  'author',
  'isbn',
  'category',
  'price',
  'currency',
  'stock',
  'publisher',
  'publishedYear',
  'description',
  'coverImage',
  'coverId',
  'coverEditionKey',
  'language',
  'pageCount'
];

function normalizeBookPayload(body = {}) {
  const payload = {};

  for (const field of BOOK_FIELDS) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      payload[field] = body[field];
    }
  }

  if (payload.price !== undefined) {
    payload.price = Number(payload.price);
  }

  if (payload.stock !== undefined) {
    payload.stock = Number(payload.stock);
  }

  if (payload.publishedYear !== undefined) {
    payload.publishedYear = Number(payload.publishedYear);
  }

  if (payload.coverId !== undefined) {
    payload.coverId = Number(payload.coverId);
  }

  if (payload.pageCount !== undefined) {
    payload.pageCount = Number(payload.pageCount);
  }

  if (!payload.currency) {
    payload.currency = 'ETB';
  }

  if (payload.isbn && !payload.coverImage) {
    payload.coverImage = `https://covers.openlibrary.org/b/isbn/${payload.isbn}-L.jpg`;
  }

  return payload;
}

router.get('/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }).lean();
    res.json({ books });
  } catch (err) {
    console.error('Admin list books error:', err);
    res.status(500).json({ error: 'Failed to load books' });
  }
});

router.post('/books', async (req, res) => {
  try {
    const payload = normalizeBookPayload(req.body);
    const requiredFields = ['title', 'author', 'isbn', 'category', 'price'];

    for (const field of requiredFields) {
      if (!payload[field] && payload[field] !== 0) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const book = await Book.findOneAndUpdate(
      { isbn: payload.isbn },
      { $set: payload, $setOnInsert: { stock: payload.stock ?? 0 } },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ book });
  } catch (err) {
    console.error('Create book error:', err);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

router.patch('/books/:id', async (req, res) => {
  try {
    const payload = normalizeBookPayload(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No fields provided' });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { returnDocument: 'after', runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book });
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Upload a new document
// Frontend expects POST /api/admin/documents with form-data field "file"
router.post('/documents', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'File is required' });
  }

  const mimeType = file.mimetype;
  const filePath = file.path;

  let doc;
  try {
    doc = await Document.create({
      filename: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      status: 'processing'
    });

    const rawText = await extractTextFromFile(filePath, mimeType);
    const cleaned = cleanText(rawText);

    if (!cleaned) {
      throw new Error('No text found in document');
    }

    const chunks = await chunkText(cleaned);

    const chunkDocs = [];
    for (const chunk of chunks) {
      const embedding = await embedDocumentText(chunk.text);

      const chunkDoc = await Chunk.create({
        text: chunk.text,
        embedding,
        documentId: doc._id,
        metadata: {
          ...chunk.metadata,
          filename: file.originalname
        }
      });

      chunkDocs.push(chunkDoc);
    }

    doc.status = 'ready';
    await doc.save();

    res.status(201).json({
      document: {
        id: doc._id,
        filename: doc.filename,
        status: doc.status
      },
      chunks: chunkDocs.length
    });
  } catch (err) {
    console.error('Upload/ingestion error:', err);
    if (doc) {
      doc.status = 'error';
      await doc.save();
    }
    res.status(500).json({ error: 'Failed to ingest document' });
  }
});

// List documents
router.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find().sort({ uploadedAt: -1 });

    // Shape response to what the frontend expects
    const normalized = docs.map((doc) => ({
      _id: doc._id,
      originalName: doc.originalName || doc.filename,
      mimeType: doc.mimeType || 'application/octet-stream',
      size: doc.size || 0,
      status: doc.status,
      createdAt: doc.uploadedAt || doc.createdAt
    }));

    res.json({ documents: normalized });
  } catch (err) {
    console.error('List documents error:', err);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

router.delete('/documents/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await Chunk.deleteMany({ documentId: doc._id });
    await doc.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

router.post('/reindex', async (req, res) => {
  res.json({
    message:
      'Reindexing placeholder. Implement custom reindex logic here if needed.'
  });
});

export default router;

