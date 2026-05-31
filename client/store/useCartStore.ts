import { create } from 'zustand';
import { Book } from '../types';

type CartItem = Book & { quantity: number };

type CartState = {
  items: CartItem[];
  addToCart: (book: Book, quantity?: number) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  hydrateCart: () => void;
};

const CART_KEY = 'mastewal_cart';

const saveCart = (items: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addToCart: (book, quantity = 1) => {
    const items = get().items;
    const existing = items.find((item) => item.id === book.id);

    let nextItems: CartItem[];
    if (existing) {
      nextItems = items.map((item) =>
        item.id === book.id ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      nextItems = [...items, { ...book, quantity }];
    }

    set({ items: nextItems });
    saveCart(nextItems);
  },
  removeFromCart: (bookId) => {
    const nextItems = get().items.filter((item) => item.id !== bookId);
    set({ items: nextItems });
    saveCart(nextItems);
  },
  updateQuantity: (bookId, quantity) => {
    const nextItems = get().items
      .map((item) => (item.id === bookId ? { ...item, quantity: Math.max(1, quantity) } : item))
      .filter((item) => item.quantity > 0);
    set({ items: nextItems });
    saveCart(nextItems);
  },
  clearCart: () => {
    set({ items: [] });
    localStorage.removeItem(CART_KEY);
  },
  hydrateCart: () => {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      set({ items: Array.isArray(parsed) ? parsed : [] });
    } catch {
      localStorage.removeItem(CART_KEY);
    }
  }
}));