// frontend/src/services/api.ts
import axios from 'axios';
import { storage } from './storage';
import {
  User,
  Category,
  Card,
  CardDTO,
  CreateCardDTO,
  UpdateCardDTO,
  Service,
  Transaction,
  MonthlySummary,
  GooglePayTransactionDTO,
} from '../types';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.moneyapp.com',
  timeout: 25000,
});

export const getApiErrorMessage = (error: any): string => {
  return (
    error?.response?.data?.details ||
    error?.response?.data?.error ||
    error?.message ||
    'Error de conexion'
  );
};

api.interceptors.request.use(
  async (config) => {
    let token = null;
    try {
      token = await storage.getItem('userToken');
    } catch (error) {
      // Storage access error
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await storage.deleteItem('userToken');
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

// --- User API ---
export const userApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get('/user');
    return res.data.data;
  },

  updateProfile: async (data: {
    name?: string;
    email?: string;
    password?: string;
  }): Promise<User> => {
    const res = await api.put('/user', data);
    return res.data.data;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/user');
  },
};

// --- Transactions API ---
export const transactionsApi = {
  getAll: async (params?: {
    type?: string;
    categoryId?: string;
    cardId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> => {
    const res = await api.get('/transactions', { params });
    return res.data.data || [];
  },

  getById: async (id: string): Promise<Transaction> => {
    const res = await api.get(`/transactions/${id}`);
    return res.data.data;
  },

  getSummary: async (month?: string): Promise<MonthlySummary> => {
    const res = await api.get('/transactions/summary', { params: { month } });
    return res.data.data;
  },

  create: async (data: {
    amount: number;
    type?: string;
    categoryId?: string | null;
    cardId?: string | null;
    note?: string | null;
    origin?: string;
    date?: string;
  }): Promise<Transaction> => {
    const res = await api.post('/transactions', data);
    return res.data.data;
  },

  createGooglePay: async (data: GooglePayTransactionDTO): Promise<Transaction> => {
    const res = await api.post('/transactions/google-pay', data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: {
      amount?: number;
      type?: string;
      categoryId?: string | null;
      cardId?: string | null;
      note?: string | null;
      origin?: string;
      date?: string;
    }
  ): Promise<Transaction> => {
    const res = await api.put(`/transactions/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

// --- Cards API ---
export const cardsApi = {
  getAll: async (): Promise<Card[]> => {
    const res = await api.get('/card');
    return res.data.data || [];
  },

  getById: async (id: string): Promise<Card> => {
    const res = await api.get(`/card/${id}`);
    return res.data.data;
  },

  getByLast4: async (last4: string): Promise<Card> => {
    const res = await api.get('/card/by_l4', { params: { last4 } });
    return res.data.data;
  },

  create: async (data: CreateCardDTO): Promise<Card> => {
    const res = await api.post('/card', data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: UpdateCardDTO
  ): Promise<Card> => {
    const res = await api.put(`/card/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/card/${id}`);
  },
};

// --- Categories API ---
export const categoriesApi = {
  getAll: async (type?: string): Promise<Category[]> => {
    const res = await api.get('/category', { params: { type } });
    return res.data.data || [];
  },

  create: async (data: {
    name: string;
    color: string;
    icon?: string;
    type?: string;
    budget?: number | null;
  }): Promise<Category> => {
    const res = await api.post('/category', data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      color?: string;
      icon?: string;
      type?: string;
      budget?: number | null;
    }
  ): Promise<Category> => {
    const res = await api.put(`/category/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/category/${id}`);
  },
};

// --- Services to Pay API ---
export const servicesApi = {
  getAll: async (state?: string): Promise<Service[]> => {
    const res = await api.get('/services', { params: { state } });
    return res.data.data || [];
  },

  getById: async (id: string): Promise<Service> => {
    const res = await api.get(`/services/${id}`);
    return res.data.data;
  },

  create: async (data: {
    name: string;
    amount: number;
    categoryId?: string | null;
    dueDate?: string | null;
    state?: string;
    payDay?: number | null;
  }): Promise<Service> => {
    const res = await api.post('/services', data);
    return res.data.data;
  },

  markAsPaid: async (id: string, state?: string): Promise<Service> => {
    const res = await api.put(`/services/${id}/pay`, state ? { state } : undefined);
    return res.data.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      amount?: number;
      categoryId?: string | null;
      dueDate?: string | null;
      state?: string;
      payDay?: number | null;
    }
  ): Promise<Service> => {
    const res = await api.put(`/services/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};

export default api;