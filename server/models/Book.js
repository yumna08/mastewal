import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    isbn: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'ETB',
        uppercase: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    publisher: {
        type: String,
        trim: true
    },
    publishedYear: {
        type: Number
    },
    description: {
        type: String,
        trim: true
    },
    coverImage: {
        type: String,
        trim: true
    },
    coverId: {
        type: Number
    },
    coverEditionKey: {
        type: String,
        trim: true
    },
    language: {
        type: String,
        default: 'English'
    },
    pageCount: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
bookSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Book = mongoose.model('Book', bookSchema);

export default Book;
