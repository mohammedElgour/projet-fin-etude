import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const authApi = {
  login: async (payloadOrEmail, maybePassword) => {
    const payload =
      typeof payloadOrEmail === 'object' && payloadOrEmail !== null
        ? payloadOrEmail
        : { email: payloadOrEmail, password: maybePassword };

    const response = await api.post('/login', payload);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },
};

export const notificationApi = {
  list: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

export const adminApi = {
  dashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
};

export const professeurApi = {
  notes: async (params = {}) => {
    const response = await api.get('/professeur/notes', { params });
    return response.data;
  },
  students: async (params = {}) => {
    const response = await api.get('/professeur/students', { params });
    return response.data;
  },
  schedule: async (params = {}) => {
    const response = await api.get('/professeur/schedule', { params });
    return response.data;
  },
};

export const stagiaireApi = {
  notes: async () => {
    const response = await api.get('/stagiaire/notes');
    return response.data;
  },
  schedule: async () => {
    const response = await api.get('/stagiaire/schedule');
    return response.data;
  },
  announcements: async () => {
    const response = await api.get('/stagiaire/announcements');
    return response.data;
  },
  recommendation: async () => {
    const response = await api.get('/stagiaire/ai-recommendation');
    return response.data;
  },
};
