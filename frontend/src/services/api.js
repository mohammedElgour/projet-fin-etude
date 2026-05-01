import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
const STORAGE_TOKEN_KEY = 'token';
const LEGACY_STORAGE_TOKEN_KEY = 'sms_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const getStoredToken = () =>
  localStorage.getItem(STORAGE_TOKEN_KEY) || localStorage.getItem(LEGACY_STORAGE_TOKEN_KEY) || '';

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

setAuthToken(getStoredToken());

const unwrapList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
};

const createAdminResourceApi = (resource) => ({
  list: async (params = {}) => {
    const response = await api.get(`/admin/${resource}`, { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/admin/${resource}/${id}`);
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post(`/admin/${resource}`, payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/admin/${resource}/${id}`, payload);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/admin/${resource}/${id}`);
    return response.data;
  },
});

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
  filieres: createAdminResourceApi('filieres'),
  modules: createAdminResourceApi('modules'),
  stagiaires: createAdminResourceApi('stagiaires'),
  professeurs: createAdminResourceApi('professeurs'),
  groupes: createAdminResourceApi('groupes'),
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
  dashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
  pendingNotes: async () => {
    const response = await api.get('/admin/notes/pending');
    return response.data;
  },
  validateNote: async (noteId) => {
    const response = await api.patch(`/admin/notes/${noteId}/validate`);
    return response.data;
  },
  rejectNote: async (noteId, feedback = '') => {
    const response = await api.patch(`/admin/notes/${noteId}/reject`, { feedback });
    return response.data;
  },
  catalogs: async () => {
    const [filieres, groupes] = await Promise.all([
      api.get('/admin/filieres', { params: { per_page: 100 } }),
      api.get('/admin/groupes', { params: { per_page: 100 } }),
    ]);

    return {
      filieres: unwrapList(filieres.data),
      groupes: unwrapList(groupes.data),
    };
  },
};

export { unwrapList };

export const professeurApi = {
  notes: async (params = {}) => {
    const response = await api.get('/professeur/notes', { params });
    return response.data;
  },
  saveNote: async (payload) => {
    const response = await api.post('/professeur/notes', payload);
    return response.data;
  },
  updateNote: async (noteId, payload) => {
    const response = await api.patch(`/professeur/notes/${noteId}`, payload);
    return response.data;
  },
  stagiaires: async (params = {}) => {
    const response = await api.get('/professeur/stagiaires', { params });
    return response.data;
  },
  notificationsCount: async () => {
    const response = await api.get('/notifications/count');
    return response.data;
  },
  catalog: async () => {
    const response = await api.get('/professeur/catalog');
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
