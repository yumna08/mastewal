
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  publisher?: string;
  publishedYear?: number;
  description?: string;
  coverImage?: string;
  coverId?: number;
  coverEditionKey?: string;
  language?: string;
  pageCount?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => void;
}
