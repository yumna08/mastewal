import mongoose from 'mongoose';
// import fetch from 'node-fetch';
import connectDb from '../config/db.js';
import Book from '../models/Book.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const CATEGORIES = [
  'Programming',
  'Software Engineering',
  'Databases',
  'AI & Machine Learning',
  'Business & Economics',
  'Fiction',
  'Education',
  'Self-Help'
];

const TARGET_BOOK_COUNT = 15;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchBooksByCategory(category, limit = 20, attempt = 1) {
  const fields = [
    'title',
    'author_name',
    'isbn',
    'cover_i',
    'cover_edition_key',
    'publisher',
    'first_publish_year',
    'subject',
    'language',
    'number_of_pages_median'
  ].join(',');

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(category)}&limit=${limit}&fields=${fields}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'mastewal-seeder/1.0'
      }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 80)}`);
    }

    const data = await response.json();
    return data.docs;
  } catch (error) {
    if (attempt < 3) {
      console.warn(`Retrying category ${category} (attempt ${attempt + 1})...`);
      await wait(500 * attempt);
      return fetchBooksByCategory(category, limit, attempt + 1);
    }

    console.error(`Error fetching category ${category}:`, error.message);
    return [];
  }
}

function getRandomStock() {
  return Math.floor(Math.random() * 50) + 5;
}

function calculateEtbPrice(pageCount = 300) {
  const base = 700;
  const perPage = 3.5;
  const variance = Math.floor(Math.random() * 200);
  const price = Math.round(base + pageCount * perPage + variance);
  return Math.min(Math.max(price, 500), 3500);
}

async function seedBooks() {
  await connectDb();
  console.log('Connected to MongoDB');

  let totalBooks = 0;
  const seenIsbn = new Set();

  for (const category of CATEGORIES) {
    if (totalBooks >= TARGET_BOOK_COUNT) break;

    console.log(`Fetching books for category: ${category}...`);
    const books = await fetchBooksByCategory(category);

    for (const bookData of books) {
      if (totalBooks >= TARGET_BOOK_COUNT) break;
      if (!bookData.isbn || bookData.isbn.length === 0) continue;

      const isbn = bookData.isbn[0];
      if (seenIsbn.has(isbn)) continue;

      const book = {
        title: bookData.title,
        author: bookData.author_name ? bookData.author_name[0] : 'Unknown Author',
        isbn: isbn,
        category: category,
        price: calculateEtbPrice(bookData.number_of_pages_median),
        currency: 'ETB',
        stock: getRandomStock(),
        publisher: bookData.publisher ? bookData.publisher[0] : 'Unknown Publisher',
        publishedYear: bookData.first_publish_year || 2000,
        description: `A book about ${category}. Key subjects: ${bookData.subject ? bookData.subject.slice(0, 5).join(', ') : 'General'}.`,
        coverImage: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
        coverId: typeof bookData.cover_i === 'number' ? bookData.cover_i : undefined,
        coverEditionKey: bookData.cover_edition_key || undefined,
        language: bookData.language ? bookData.language[0] : 'English',
        pageCount: bookData.number_of_pages_median || 300
      };

      try {
        await Book.findOneAndUpdate(
          { isbn: book.isbn },
          book,
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        seenIsbn.add(isbn);
        totalBooks++;
      } catch (err) {
        console.error(`Failed to save book ${book.title}:`, err.message);
      }
    }
  }

  if (totalBooks === 0) {
    console.warn('No books were seeded. Check network access and Open Library availability.');
  } else {
    console.log(`Successfully seeded ${totalBooks} books.`);
  }
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seedBooks().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
