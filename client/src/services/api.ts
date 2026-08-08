import { User, TransferSession } from '../types/index.js';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('peerdrop_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('peerdrop_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('peerdrop_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred during request.');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    request<{ message: string; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => request<{ user: User }>('/auth/me'),

  // Sessions
  createSession: (totalSize: number, fileCount: number) =>
    request<{ session: TransferSession }>('/sessions/create', {
      method: 'POST',
      body: JSON.stringify({ totalSize, fileCount }),
    }),

  getSessionByRoomCode: (roomCode: string) =>
    request<{ session: TransferSession }>(`/sessions/room/${roomCode}`),

  getSessionById: (sessionId: string) =>
    request<{ session: TransferSession }>(`/sessions/${sessionId}`),

  getUserHistory: () =>
    request<{ sessions: TransferSession[] }>('/sessions/history'),
};
