
import React, { useState } from 'react';
import { Upload, FileText, File, CheckCircle, Clock, Trash2, AlertCircle } from 'lucide-react';
import { apiFetch, getApiBaseUrl, getApiErrorMessage, getAuthToken } from '../services/api';
import { Book, Document } from '../types';

const AdminPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [booksLoading, setBooksLoading] = useState(false);

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

  const fetchBooks = React.useCallback(async () => {
    try {
      setBooksLoading(true);
      setBooksError(null);
      const data = await apiFetch<{ books: Array<Book & { _id: string }> }>('/api/books?limit=50');
      const normalized = data.books.map((book) => ({
        ...book,
        id: book.id || book._id,
      }));
      setBooks(normalized);
    } catch (err) {
      setBooksError(getApiErrorMessage(err, 'Failed to load books.'));
    } finally {
      setBooksLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

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
      <div className="flex justify-between items-end border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Knowledge Base</h1>
          <p className="text-stone-500 font-sans">Manage the documents used to train the Bookstore AI.</p>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full border border-stone-200">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-sans font-semibold text-stone-600 uppercase tracking-wider">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </h3>
            
            <label 
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center cursor-pointer transition-all ${
                dragActive ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                className="hidden" 
                onChange={onFileChange} 
                accept=".pdf,.txt,.docx"
              />
              <div className="bg-stone-100 p-3 rounded-full mb-3">
                <FileText className="w-8 h-8 text-stone-500" />
              </div>
              <p className="text-sm font-sans font-medium text-stone-900">
                {isUploading ? `Uploading ${uploadProgress}%` : 'Click or drag files to upload'}
              </p>
              <p className="text-xs font-sans text-stone-500 mt-1">
                Supports PDF, TXT up to 10MB
              </p>

              {isUploading && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center p-6">
                  <div className="w-full max-w-[200px] space-y-2">
                    <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-800" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-500 text-center">
                      Uploading Document
                    </p>
                  </div>
                </div>
              )}
            </label>

            <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs font-sans text-stone-600 leading-relaxed">
                <strong>Note:</strong> Uploaded documents are automatically parsed and indexed into the vector database for the chatbot.
              </div>
            </div>
            {error && <p className="text-xs font-sans text-red-600 mt-3">{error}</p>}
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 font-sans">
                Active Documents ({documents.length})
              </h3>
            </div>
            
            <div className="divide-y divide-stone-100">
              {documents.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <File className="w-8 h-8 text-stone-200 mx-auto" />
                  <p className="text-stone-400 font-sans text-sm">No documents uploaded yet.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-stone-100 p-2 rounded">
                        <FileText className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 leading-none mb-1">{doc.originalName}</h4>
                        <div className="flex items-center gap-2 text-xs font-sans text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-stone-300" />
                          <span>{(doc.mimeType || 'unknown').split('/')[1]?.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${doc.status === 'ready' ? 'bg-green-50 text-green-700' : doc.status === 'processing' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{doc.status}</span>
                      </div>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Inventory</h2>
            <p className="text-sm text-stone-500 font-sans">Real catalog data from MongoDB.</p>
          </div>
          <span className="text-xs font-sans uppercase tracking-wider text-stone-500">
            {books.length} titles
          </span>
        </div>

        {booksError && (
          <p className="text-sm font-sans text-red-600">{booksError}</p>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 py-3 text-xs font-sans font-semibold uppercase tracking-wider text-stone-500 bg-stone-50 border-b border-stone-100">
            <span>Title</span>
            <span>Author</span>
            <span>Category</span>
            <span className="text-right">Price / Stock</span>
          </div>

          {booksLoading ? (
            <div className="p-6 text-center text-sm text-stone-400 font-sans">Loading inventory...</div>
          ) : books.length === 0 ? (
            <div className="p-6 text-center text-sm text-stone-400 font-sans">No books found.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {books.map((book) => (
                <div key={book.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 py-4 items-center hover:bg-stone-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{book.title}</p>
                    <p className="text-xs text-stone-500 font-sans">ISBN {book.isbn}</p>
                  </div>
                  <p className="text-sm text-stone-600 font-sans">{book.author}</p>
                  <span className="text-xs font-sans uppercase tracking-wider text-stone-500">{book.category}</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stone-900">{book.price} {book.currency}</p>
                    <p className="text-xs text-stone-500 font-sans">Stock {book.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
