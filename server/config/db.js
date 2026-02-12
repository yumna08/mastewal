import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'mastewal_chat';

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });

    const conn = mongoose.connection;

    conn.on('connected', () => {
      console.log(`MongoDB connected to database "${DB_NAME}"`);
    });

    conn.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    conn.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    return conn;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

async function ensureVectorIndex() {
  const conn = mongoose.connection;
  if (!conn.readyState) {
    console.warn('MongoDB not connected, skipping vector index setup');
    return;
  }

  const db = conn.db;
  // Use a dedicated collection for RAG chunks to avoid GridFS "chunks" namespace.
  const collectionName = 'rag_chunks';
  const indexName = process.env.VECTOR_INDEX_NAME || 'chunk_vector_index';
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS || 1024);

  try {
    const collection = db.collection(collectionName);
    const indexes = await collection.indexes();
    const existing = indexes.find((idx) => idx.name === indexName);

    if (existing) {
      console.log(`Vector index "${indexName}" already exists on "${collectionName}"`);
      return;
    }

    console.log(`Creating vector index "${indexName}" on "${collectionName}"...`);

    await collection.createIndex(
      { embedding: 'vectorSearch' },
      {
        name: indexName,
        vectorSearchOptions: {
          numDimensions: dimensions,
          similarity: 'cosine'
        }
      }
    );

    console.log(`Vector index "${indexName}" created successfully.`);
  } catch (err) {
    // On non-Atlas or clusters without vector search, this will fail with
    // "Unknown index plugin 'vectorSearch'". In that case we log once and continue.
    if (
      err &&
      (err.code === 67 ||
        (typeof err.message === 'string' && err.message.includes('Unknown index plugin')))
    ) {
      console.warn(
        'Vector search index creation is not supported on this MongoDB cluster. ' +
          'Continuing without automatic vector index.'
      );
      return;
    }
    console.error('Error ensuring vector index:', err);
  }
}

export { ensureVectorIndex };
export default connectDb;

