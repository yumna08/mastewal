const TOKEN_KEY = 'mastewal_token';

type ApiError = {
  status: number;
  message: string;
};

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

export const getApiBaseUrl = () => {
  const base = 'https://mastewal-1.onrender.com'; // Default for development
  return base.replace(/\/$/, '');
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message || fallback);
  }
  return fallback;
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw { status: 401, message: 'Unauthorized' } as ApiError;
  }

  if (response.status === 403) {
    throw { status: 403, message: 'Access denied' } as ApiError;
  }

  if (!response.ok) {
    const message = response.status >= 500
      ? 'Something went wrong. Please try again.'
      : await response.text();
    throw { status: response.status, message } as ApiError;
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  return data as T;
};
