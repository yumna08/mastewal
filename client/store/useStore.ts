
import { create } from 'zustand';
import { AuthState, User } from '../types';
import { apiFetch, setAuthToken, setUnauthorizedHandler } from '../services/api';

const normalizeUser = (user: { id: string; name: string; email: string; role: 'admin' | 'user' }): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (email, password) => {
    const data = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    set({ user: normalizeUser(data.user), token: data.token, isAuthenticated: true });
  },
  signup: async (name, email, password) => {
    const data = await apiFetch<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(data.token);
    set({ user: normalizeUser(data.user), token: data.token, isAuthenticated: true });
  },
  loginWithGoogle: async (idToken) => {
    const data = await apiFetch<{ token: string; user: User }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    setAuthToken(data.token);
    set({ user: normalizeUser(data.user), token: data.token, isAuthenticated: true });
  },
  hydrate: async () => {
    const existingToken = localStorage.getItem('mastewal_token');
    if (!existingToken) {
      set({ isLoading: false });
      return;
    }

    set({ token: existingToken });
    try {
      const data = await apiFetch<{ user: User }>('/api/auth/me');
      set({ user: normalizeUser(data.user), isAuthenticated: true, isLoading: false });
    } catch (error) {
      setAuthToken(null);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
  logout: () => {
    setAuthToken(null);
    localStorage.removeItem('mastewal_chat_session');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));

setUnauthorizedHandler(() => {
  const { logout } = useAuthStore.getState();
  logout();
});
