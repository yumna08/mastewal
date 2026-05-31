import express from 'express';
import Book from '../models/Book.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { limit = '15', category, search } = req.query;
  const parsedLimit = Number(limit) || 15;
  const filters = {};

  if (category) {
    filters.category = category;
  }

  if (search) {
    const regex = new RegExp(String(search), 'i');
    filters.$or = [{ title: regex }, { author: regex }];
  }

  try {
    const books = await Book.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    res.json({ books });
  } catch (err) {
    console.error('List books error:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book });
  } catch (err) {
    console.error('Get book error:', err);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

export default router;
