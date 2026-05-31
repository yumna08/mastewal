
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, File, CheckCircle, Clock, Trash2, AlertCircle, Sparkles, Plus, PencilLine, BookOpen, BadgeDollarSign } from 'lucide-react';
import { apiFetch, getApiBaseUrl, getApiErrorMessage, getAuthToken } from '../services/api';
import { Book, Document } from '../types';

type BookFormState = {
  title: string;
  author: string;
  isbn: string;
  category: string;
  price: string;
  stock: string;
  publisher: string;
  publishedYear: string;
  description: string;
  coverImage: string;
};

const AdminPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookForm, setBookForm] = useState<BookFormState>({
    title: '',
    author: '',
    isbn: '',
    category: '',
    price: '',
    stock: '10',
    publisher: '',
    publishedYear: '',
    description: '',
    coverImage: '',
  });
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const refreshBooks = React.useCallback(async () => {
    try {
      setBooksLoading(true);
      setBooksError(null);
      const data = await apiFetch<{ books: Array<Book & { _id: string }> }>('/api/admin/books');
      const normalized = data.books.map((book) => ({
        ...book,
        id: book.id || book._id,
      }));
      setBooks(normalized);
      setPriceDrafts(
        normalized.reduce<Record<string, string>>((accumulator, book) => {
          accumulator[book.id] = String(book.price ?? '');
          return accumulator;
        }, {})
      );
    } catch (err) {
      setBooksError(getApiErrorMessage(err, 'Failed to load books.'));
    } finally {
      setBooksLoading(false);
    }
  }, []);

  const fetchDocuments = React.useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<{ documents: Array<{ _id: string; originalName: string; mimeType: string; size: number; status: 'processing' | 'ready' | 'failed'; createdAt: string; }> }>(
        '/api/admin/documents'
      );
      const normalized = data.documents.map((doc) => ({
        id: doc._id,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        status: doc.status,
        createdAt: doc.createdAt,
      }));
      setDocuments(normalized);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load documents.'));
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  React.useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  const handleBookFormChange = (field: keyof BookFormState, value: string) => {
    setBookForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookForm.title || !bookForm.author || !bookForm.isbn || !bookForm.category || !bookForm.price) {
      setBooksError('Title, author, ISBN, category, and price are required.');
      return;
    }

    try {
      setIsSavingBook(true);
      setBooksError(null);

      await apiFetch('/api/admin/books', {
        method: 'POST',
        body: JSON.stringify({
          ...bookForm,
          price: Number(bookForm.price),
          stock: Number(bookForm.stock || 0),
          publishedYear: bookForm.publishedYear ? Number(bookForm.publishedYear) : undefined,
        }),
      });

      setBookForm({
        title: '',
        author: '',
        isbn: '',
        category: '',
        price: '',
        stock: '10',
        publisher: '',
        publishedYear: '',
        description: '',
        coverImage: '',
      });
      await refreshBooks();
    } catch (err) {
      setBooksError(getApiErrorMessage(err, 'Failed to create book.'));
    } finally {
      setIsSavingBook(false);
    }
  };

  const handlePriceSave = async (bookId: string) => {
    const nextPrice = Number(priceDrafts[bookId]);

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      setBooksError('Enter a valid price before saving.');
      return;
    }

    try {
      setBooksError(null);
      await apiFetch(`/api/admin/books/${bookId}`, {
        method: 'PATCH',
        body: JSON.stringify({ price: nextPrice }),
      });
      await refreshBooks();
    } catch (err) {
      setBooksError(getApiErrorMessage(err, 'Failed to update price.'));
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${getApiBaseUrl()}/api/admin/documents`);
        const token = getAuthToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(xhr.responseText || 'Upload failed.'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed.'));
        });

        xhr.send(formData);
      });

      await fetchDocuments();
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        await handleUpload(e.target.files[0]);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to upload document.'));
        setIsUploading(false);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      try {
        await handleUpload(e.dataTransfer.files[0]);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to upload document.'));
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await apiFetch(`/api/admin/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete document.'));
    }
  };

  return (
    <div className="space-y-10 py-6 animate-in slide-in-from-bottom-4 duration-500">
      <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-[linear-gradient(135deg,#171311_0%,#3f2e26_45%,#f2e7d8_100%)] text-stone-50 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.25),transparent_28%)]" />
        <div className="relative grid gap-8 p-8 md:p-12 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-400/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-100">
              <Sparkles className="h-4 w-4" />
              Admin control room
            </div>
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Manage the store from one control panel.</h1>
              <p className="max-w-xl text-stone-200 text-base md:text-lg leading-relaxed">
                Add new books, change prices instantly, and upload files for the RAG knowledge base without leaving this page.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-300">Books</p>
                <p className="mt-2 text-2xl font-bold">{books.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-300">Docs</p>
                <p className="mt-2 text-2xl font-bold">{documents.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-300">RAG</p>
                <p className="mt-2 text-2xl font-bold">Ready</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-white text-stone-900 p-5 shadow-xl border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-stone-900 p-3 text-stone-50">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Add books</p>
                  <p className="text-xs text-stone-500">Create new catalog entries</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white text-stone-900 p-5 shadow-xl border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-500 p-3 text-stone-950">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Modify prices</p>
                  <p className="text-xs text-stone-500">Update live pricing</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white text-stone-900 p-5 shadow-xl border border-stone-100 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-600 p-3 text-white">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Upload RAG files</p>
                  <p className="text-xs text-stone-500">PDF and DOCX ingestion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-8">
        <section className="space-y-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-2xl bg-stone-900 p-3 text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Add a book</h2>
                <p className="text-sm text-stone-500 font-sans">Create a new listing and automatically generate a cover image URL from the ISBN if you leave it blank.</p>
              </div>
            </div>

            <form onSubmit={handleCreateBook} className="grid gap-4 md:grid-cols-2">
              {[
                ['title', 'Title'],
                ['author', 'Author'],
                ['isbn', 'ISBN'],
                ['category', 'Category'],
                ['price', 'Price'],
                ['stock', 'Stock'],
                ['publisher', 'Publisher'],
                ['publishedYear', 'Published year'],
              ].map(([field, label]) => (
                <label key={field} className="space-y-2 text-sm">
                  <span className="font-medium text-stone-700">{label}</span>
                  <input
                    value={bookForm[field as keyof BookFormState]}
                    onChange={(event) => handleBookFormChange(field as keyof BookFormState, event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  />
                </label>
              ))}

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="font-medium text-stone-700">Description</span>
                <textarea
                  value={bookForm.description}
                  onChange={(event) => handleBookFormChange('description', event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                />
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="font-medium text-stone-700">Cover image URL</span>
                <input
                  value={bookForm.coverImage}
                  onChange={(event) => handleBookFormChange('coverImage', event.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  placeholder="Leave blank to auto-generate from ISBN"
                />
              </label>

              <div className="md:col-span-2 flex items-center justify-between gap-4">
                <p className="text-xs text-stone-500">The new book is saved through the admin API and will appear in the storefront immediately.</p>
                <button
                  type="submit"
                  disabled={isSavingBook}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
                >
                  {isSavingBook ? 'Saving...' : 'Add book'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-2xl bg-amber-500 p-3 text-stone-950">
                <PencilLine className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Modify prices</h2>
                <p className="text-sm text-stone-500 font-sans">Edit any book price from the current catalog.</p>
              </div>
            </div>

            {booksError && <p className="mb-4 text-sm text-red-600">{booksError}</p>}

            <div className="space-y-3">
              {booksLoading ? (
                <div className="py-8 text-center text-sm text-stone-400 font-sans">Loading inventory...</div>
              ) : books.length === 0 ? (
                <div className="py-8 text-center text-sm text-stone-400 font-sans">No books found.</div>
              ) : (
                books.map((book) => (
                  <div key={book.id} className="grid gap-3 rounded-2xl border border-stone-200 p-4 md:grid-cols-[1.5fr_0.6fr_auto] md:items-center">
                    <Link to={`/books/${book.id}`} className="block rounded-xl p-1 transition hover:bg-stone-50">
                      <p className="text-sm font-semibold text-stone-900 hover:underline">{book.title}</p>
                      <p className="text-xs text-stone-500 font-sans">{book.author} · {book.category} · ISBN {book.isbn}</p>
                    </Link>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Price</span>
                      <input
                        value={priceDrafts[book.id] ?? ''}
                        onChange={(event) => setPriceDrafts((prev) => ({ ...prev, [book.id]: event.target.value }))}
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 outline-none transition focus:border-stone-400"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePriceSave(book.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      Save price
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-2xl bg-emerald-600 p-3 text-white">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Upload RAG file</h2>
                <p className="text-sm text-stone-500 font-sans">Upload documents that will be parsed and indexed for the chatbot.</p>
              </div>
            </div>

            <label
              className={`relative flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" className="hidden" onChange={onFileChange} accept=".pdf,.docx" />
              <div className="mb-4 rounded-full bg-stone-100 p-4">
                <FileText className="h-8 w-8 text-stone-600" />
              </div>
              <p className="text-sm font-semibold text-stone-900">{isUploading ? `Uploading ${uploadProgress}%` : 'Click or drag to upload'}</p>
              <p className="mt-1 text-xs text-stone-500">Supports PDF and DOCX</p>

              {isUploading && (
                <div className="absolute inset-0 rounded-3xl bg-white/85 p-6 flex items-center justify-center">
                  <div className="w-full max-w-[220px] space-y-2">
                    <div className="h-1 rounded-full bg-stone-200 overflow-hidden">
                      <div className="h-full bg-stone-900" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 text-center">Indexing document</p>
                  </div>
                </div>
              )}
            </label>

            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
              <p className="text-xs leading-relaxed text-stone-600">
                Uploaded documents are chunked and embedded automatically, then stored in the RAG collection for retrieval.
              </p>
            </div>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-stone-100 bg-stone-50 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-500">Active documents ({documents.length})</h3>
            </div>

            <div className="divide-y divide-stone-100">
              {documents.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <File className="mx-auto h-8 w-8 text-stone-200" />
                  <p className="text-sm text-stone-400 font-sans">No documents uploaded yet.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-4 p-4 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="rounded-xl bg-stone-100 p-2">
                        <FileText className="h-5 w-5 text-stone-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-stone-900">{doc.originalName}</h4>
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-stone-300" />
                          <span>{(doc.mimeType || 'unknown').split('/')[1]?.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tight ${doc.status === 'ready' ? 'bg-green-50 text-green-700' : doc.status === 'processing' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>{doc.status}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="rounded-full p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
