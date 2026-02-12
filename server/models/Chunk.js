import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      required: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    // Use a non-reserved collection name to avoid conflict with GridFS "chunks"
    collection: 'rag_chunks'
  }
);

const Chunk = mongoose.model('Chunk', chunkSchema);

export default Chunk;

