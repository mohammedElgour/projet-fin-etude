import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
export const STORAGE_TOKEN_KEY = 'sms_token';
export const ADMIN_DASHBOARD_REFRESH_EVENT = 'admin-dashboard:refresh';

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(STORAGE_TOKEN_KEY) || '';
};

const applyAuthorizationHeader = (headers, token) => {
  if (!headers) {
    return;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    delete headers.Authorization;
  }
};

const emitAdminDashboardRefresh = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_DASHBOARD_REFRESH_EVENT));
  }
};

const withAdminDashboardRefresh = async (request) => {
  const data = await request();
  emitAdminDashboardRefresh();
  return data;
};

const initialToken = getStoredToken();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(initialToken ? { Authorization: `Bearer ${initialToken}` } : {}),
  },
});

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    if (token) {
      window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  }

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  config.headers = config.headers || {};
  config.headers.Accept = 'application/json';
  applyAuthorizationHeader(config.headers, token);

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      setAuthToken('');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

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
  students: async (params = {}) => {
    const response = await api.get('/admin/stagiaires', { params });
    return response.data;
  },
  student: async (id) => {
    const response = await api.get(`/admin/stagiaires/${id}`);
    return response.data;
  },
  createStudent: async (payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.post('/admin/stagiaires', payload);
      return response.data;
    });
  },
  updateStudent: async (id, payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.put(`/admin/stagiaires/${id}`, payload);
      return response.data;
    });
  },
  deleteStudent: async (id) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.delete(`/admin/stagiaires/${id}`);
      return response.data;
    });
  },
  professors: async (params = {}) => {
    const response = await api.get('/admin/professeurs', { params });
    return response.data;
  },
  professor: async (id) => {
    const response = await api.get(`/admin/professeurs/${id}`);
    return response.data;
  },
  createProfessor: async (payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.post('/admin/professeurs', payload);
      return response.data;
    });
  },
  updateProfessor: async (id, payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.put(`/admin/professeurs/${id}`, payload);
      return response.data;
    });
  },
  deleteProfessor: async (id) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.delete(`/admin/professeurs/${id}`);
      return response.data;
    });
  },
  filieres: async (params = {}) => {
    const response = await api.get('/admin/filieres', { params });
    return response.data;
  },
  filiere: async (id) => {
    const response = await api.get(`/admin/filieres/${id}`);
    return response.data;
  },
  createFiliere: async (payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.post('/admin/filieres', payload);
      return response.data;
    });
  },
  updateFiliere: async (id, payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.put(`/admin/filieres/${id}`, payload);
      return response.data;
    });
  },
  deleteFiliere: async (id) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.delete(`/admin/filieres/${id}`);
      return response.data;
    });
  },
  modules: async (params = {}) => {
    const response = await api.get('/admin/modules', { params });
    return response.data;
  },
  module: async (id) => {
    const response = await api.get(`/admin/modules/${id}`);
    return response.data;
  },
  createModule: async (payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.post('/admin/modules', payload);
      return response.data;
    });
  },
  updateModule: async (id, payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.put(`/admin/modules/${id}`, payload);
      return response.data;
    });
  },
  deleteModule: async (id) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.delete(`/admin/modules/${id}`);
      return response.data;
    });
  },
  groups: async (params = {}) => {
    const response = await api.get('/admin/groupes', { params });
    return response.data;
  },
  group: async (id) => {
    const response = await api.get(`/admin/groupes/${id}`);
    return response.data;
  },
  createGroup: async (payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.post('/admin/groupes', payload);
      return response.data;
    });
  },
  updateGroup: async (id, payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.put(`/admin/groupes/${id}`, payload);
      return response.data;
    });
  },
  deleteGroup: async (id) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.delete(`/admin/groupes/${id}`);
      return response.data;
    });
  },
  timetables: async (params = {}) => {
    const response = await api.get('/admin/timetables', { params });
    return response.data;
  },
  timetable: async (id) => {
    const response = await api.get(`/admin/timetables/${id}`);
    return response.data;
  },
  createTimetable: async (payload) => {
    const response = await api.post('/admin/timetables', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  pendingNotes: async () => {
    const response = await api.get('/admin/notes/pending');
    return response.data;
  },
  validateNote: async (noteId) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.patch(`/admin/notes/${noteId}/validate`);
      return response.data;
    });
  },
  rejectNote: async (noteId, feedback = '') => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.patch(`/admin/notes/${noteId}/reject`, { feedback });
      return response.data;
    });
  },
};

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
  students: async (params = {}) => {
    const response = await api.get('/professeur/students', { params });
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
  timetables: async (params = {}) => {
    const response = await api.get('/professeur/timetables', { params });
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
  timetables: async () => {
    const response = await api.get('/stagiaire/timetables');
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
