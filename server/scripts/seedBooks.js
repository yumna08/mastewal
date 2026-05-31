import mongoose from 'mongoose';
import connectDb from '../config/db.js';
import Book from '../models/Book.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BOOKS = [
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    category: 'Programming',
    publisher: 'Prentice Hall',
    publishedYear: 2008,
    pageCount: 464,
    description: 'A practical guide to writing readable, maintainable code with clear naming, small functions, and disciplined refactoring.'
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt and David Thomas',
    isbn: '9780135957059',
    category: 'Programming',
    publisher: 'Addison-Wesley',
    publishedYear: 2019,
    pageCount: 352,
    description: 'A modern classic on pragmatic habits that help developers build software with better judgment and stronger craftsmanship.'
  },
  {
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    isbn: '9780596517748',
    category: 'Programming',
    publisher: 'O\'Reilly Media',
    publishedYear: 2008,
    pageCount: 176,
    description: 'A concise look at the most reliable features of JavaScript and how to avoid the language\'s rough edges.'
  },
  {
    title: 'You Don\'t Know JS Yet: Scope & Closures',
    author: 'Kyle Simpson',
    isbn: '9781492054244',
    category: 'Programming',
    publisher: 'Independently published',
    publishedYear: 2019,
    pageCount: 88,
    description: 'A deep explanation of scope, closures, and execution context for developers who want to understand JavaScript more precisely.'
  },
  {
    title: 'Refactoring',
    author: 'Martin Fowler',
    isbn: '9780134757599',
    category: 'Software Engineering',
    publisher: 'Addison-Wesley',
    publishedYear: 2018,
    pageCount: 448,
    description: 'A practical catalog of refactoring techniques for improving the design of existing code without changing behavior.'
  },
  {
    title: 'Code Complete',
    author: 'Steve McConnell',
    isbn: '9780735619678',
    category: 'Software Engineering',
    publisher: 'Microsoft Press',
    publishedYear: 2004,
    pageCount: 960,
    description: 'A comprehensive reference on software construction, quality, design, and the habits that lead to reliable code.'
  },
  {
    title: 'Domain-Driven Design',
    author: 'Eric Evans',
    isbn: '9780321125217',
    category: 'Software Engineering',
    publisher: 'Addison-Wesley',
    publishedYear: 2003,
    pageCount: 560,
    description: 'An influential book on modeling complex software around the core domain and shared language of the business.'
  },
  {
    title: 'Working Effectively with Legacy Code',
    author: 'Michael C. Feathers',
    isbn: '9780131177055',
    category: 'Software Engineering',
    publisher: 'Prentice Hall',
    publishedYear: 2004,
    pageCount: 576,
    description: 'Techniques for safely understanding, testing, and improving codebases that are difficult to change.'
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '9781449373320',
    category: 'Databases',
    publisher: 'O\'Reilly Media',
    publishedYear: 2017,
    pageCount: 616,
    description: 'A rigorous overview of databases, distributed systems, replication, and data processing at scale.'
  },
  {
    title: 'Database Internals',
    author: 'Alex Petrov',
    isbn: '9781492040347',
    category: 'Databases',
    publisher: 'O\'Reilly Media',
    publishedYear: 2019,
    pageCount: 540,
    description: 'A detailed tour of modern storage engines, indexing structures, and the design choices behind database systems.'
  },
  {
    title: 'Learning SQL',
    author: 'Alan Beaulieu',
    isbn: '9780596520830',
    category: 'Databases',
    publisher: 'O\'Reilly Media',
    publishedYear: 2009,
    pageCount: 338,
    description: 'A beginner-friendly introduction to SQL queries, joins, filtering, grouping, and practical database work.'
  },
  {
    title: 'Fundamentals of Database Systems',
    author: 'Ramez Elmasri and Shamkant B. Navathe',
    isbn: '9780133970777',
    category: 'Databases',
    publisher: 'Pearson',
    publishedYear: 2015,
    pageCount: 1272,
    description: 'A textbook covering relational theory, modeling, normalization, transaction processing, and database architecture.'
  },
  {
    title: 'Hands-On Machine Learning',
    author: 'Aurélien Géron',
    isbn: '9781098125974',
    category: 'AI & Machine Learning',
    publisher: 'O\'Reilly Media',
    publishedYear: 2022,
    pageCount: 850,
    description: 'A practical guide to building machine learning systems with scikit-learn, TensorFlow, and real-world examples.'
  },
  {
    title: 'Deep Learning',
    author: 'Ian Goodfellow, Yoshua Bengio, and Aaron Courville',
    isbn: '9780262035613',
    category: 'AI & Machine Learning',
    publisher: 'MIT Press',
    publishedYear: 2016,
    pageCount: 800,
    description: 'A foundational text on neural networks, optimization, and the mathematics behind modern deep learning.'
  },
  {
    title: 'Pattern Recognition and Machine Learning',
    author: 'Christopher M. Bishop',
    isbn: '9780387310732',
    category: 'AI & Machine Learning',
    publisher: 'Springer',
    publishedYear: 2006,
    pageCount: 738,
    description: 'A mathematically grounded introduction to probabilistic models, inference, and machine learning methods.'
  },
  {
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell and Peter Norvig',
    isbn: '9780134610993',
    category: 'AI & Machine Learning',
    publisher: 'Pearson',
    publishedYear: 2020,
    pageCount: 1152,
    description: 'A broad survey of AI techniques spanning search, reasoning, planning, learning, and intelligent agents.'
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    isbn: '9780307887894',
    category: 'Business & Economics',
    publisher: 'Crown Business',
    publishedYear: 2011,
    pageCount: 336,
    description: 'A startup methodology focused on rapid experimentation, customer feedback, and validated learning.'
  },
  {
    title: 'Good to Great',
    author: 'Jim Collins',
    isbn: '9780066620992',
    category: 'Business & Economics',
    publisher: 'HarperBusiness',
    publishedYear: 2001,
    pageCount: 320,
    description: 'A study of companies that sustained excellent performance and the disciplined habits that made the difference.'
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '9780374533557',
    category: 'Business & Economics',
    publisher: 'Farrar, Straus and Giroux',
    publishedYear: 2011,
    pageCount: 512,
    description: 'An exploration of the two systems of thought that shape judgment, decision-making, and human bias.'
  },
  {
    title: 'Principles',
    author: 'Ray Dalio',
    isbn: '9781501164859',
    category: 'Business & Economics',
    publisher: 'Simon & Schuster',
    publishedYear: 2017,
    pageCount: 592,
    description: 'A guide to life and work principles built from the experience of creating and managing a major investment firm.'
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '9780451524935',
    category: 'Fiction',
    publisher: 'Signet Classics',
    publishedYear: 1949,
    pageCount: 328,
    description: 'A dystopian novel about surveillance, control, and the struggle to preserve truth and individuality.'
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    isbn: '9780062315007',
    category: 'Fiction',
    publisher: 'HarperOne',
    publishedYear: 1988,
    pageCount: 208,
    description: 'A fable-like story about following personal dreams, listening for signs, and finding meaning in the journey.'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '9780061120084',
    category: 'Fiction',
    publisher: 'Harper Perennial Modern Classics',
    publishedYear: 1960,
    pageCount: 336,
    description: 'A novel about justice, morality, and compassion in a small Southern town shaped by prejudice.'
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    category: 'Fiction',
    publisher: 'Scribner',
    publishedYear: 1925,
    pageCount: 180,
    description: 'A story of wealth, desire, and illusion set against the glamour and emptiness of the Jazz Age.'
  },
  {
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    isbn: '9780547928227',
    category: 'Fiction',
    publisher: 'Mariner Books',
    publishedYear: 1937,
    pageCount: 320,
    description: 'A classic adventure that follows Bilbo Baggins on a journey through dragons, riddles, and unexpected courage.'
  }
];

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
  for (const bookData of BOOKS) {
    const book = {
      ...bookData,
      price: calculateEtbPrice(bookData.pageCount),
      currency: 'ETB',
      stock: getRandomStock(),
      coverImage: `https://covers.openlibrary.org/b/isbn/${bookData.isbn}-L.jpg`,
      language: 'English',
      updatedAt: new Date()
    };

    try {
      await Book.findOneAndUpdate(
        { isbn: book.isbn },
        book,
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      totalBooks++;
    } catch (err) {
      console.error(`Failed to save book ${book.title}:`, err.message);
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
