import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true
    },
    // Optional fields to better match frontend expectations
    originalName: {
      type: String
    },
    mimeType: {
      type: String
    },
    size: {
      type: Number
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'error'],
      default: 'processing'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;

