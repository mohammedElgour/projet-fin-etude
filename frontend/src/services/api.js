import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
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

const normalizeGroupValidationPayload = (payload = {}) => {
  const submissionId = payload.submission_id ?? payload.submissionId ?? null;
  const groupeId = payload.groupe_id ?? payload.group_id ?? payload.groupId ?? payload.groupeId ?? null;
  const moduleId = payload.module_id ?? payload.moduleId ?? null;

  return {
    ...(submissionId !== null && submissionId !== undefined ? { submission_id: Number(submissionId) } : {}),
    ...(groupeId !== null && groupeId !== undefined ? { groupe_id: Number(groupeId) } : {}),
    ...(moduleId !== null && moduleId !== undefined ? { module_id: Number(moduleId) } : {}),
    ...(payload.feedback !== undefined ? { feedback: payload.feedback } : {}),
  };
};

const logApiValidationError = (context, error, payload) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
    console.debug(`[api] ${context} failed`, {
      payload,
      status: error?.response?.status,
      message: error?.response?.data?.message || error?.message,
      errors: error?.response?.data?.errors || null,
    });
  }
};

const toError = (error, fallbackMessage = 'Une erreur inattendue est survenue.') => {
  if (error instanceof Error) {
    return error;
  }

  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;

  const normalizedError = new Error(message);
  normalizedError.name = 'ApiError';
  normalizedError.cause = error;

  if (error?.response) {
    normalizedError.response = error.response;
  }

  return normalizedError;
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
    const isInactiveAccount = error?.response?.status === 403 && error?.response?.data?.code === 'account_inactive';

    if ((error?.response?.status === 401 || isInactiveAccount) && typeof window !== 'undefined') {
      setAuthToken('');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(toError(error));
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
  unreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  markRead: async (notificationId) => {
    const response = await api.post('/notifications/mark-as-read', { notification_id: notificationId });
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  deleteLocal: async (notificationId) => {
    return { id: notificationId, deleted: true };
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
  notificationGroups: async (params = {}) => {
    const response = await api.get('/groupes', { params });
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
  updateTimetable: async (id, payload) => {
    const response = await api.post(`/admin/timetables/${id}`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteTimetable: async (id) => {
    const response = await api.delete(`/admin/timetables/${id}`);
    return response.data;
  },
  noteSubmissions: async (params = {}) => {
    const response = await api.get('/admin/note-submissions', { params });
    return response.data;
  },
  evaluationQueue: async (params = {}) => {
    const response = await api.get('/admin/evaluations', { params });
    return response.data;
  },
  evaluationDetail: async (noteId, params = {}) => {
    const response = await api.get(`/admin/evaluations/${noteId}`, { params });
    return response.data;
  },
  noteSubmission: async (id) => {
    const response = await api.get(`/admin/note-submissions/${id}`);
    return response.data;
  },
  pendingNotes: async (params = {}) => {
    const response = await api.get('/admin/note-submissions', { params });
    return response.data;
  },
  workflowNotes: async (params = {}) => {
    const response = await api.get('/admin/notes/workflow', { params });
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
  approveEvaluation: async (noteId, evaluationType) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.patch(`/admin/notes/${noteId}/validate`, {
        evaluation_type: evaluationType,
      });
      return response.data;
    });
  },
  rejectEvaluation: async (noteId, evaluationType, feedback = '') => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.patch(`/admin/notes/${noteId}/reject`, {
        evaluation_type: evaluationType,
        feedback,
      });
      return response.data;
    });
  },
  validateNotesGroup: async (payload) => {
    return withAdminDashboardRefresh(async () => {
      const normalizedPayload = normalizeGroupValidationPayload(payload);
    try {
      console.debug('[api] POST /admin/notes/validate-group', normalizedPayload);
      const response = await api.post('/admin/notes/validate-group', normalizedPayload);
      return response.data;
    } catch (error) {
      logApiValidationError('POST /admin/notes/validate-group', error, normalizedPayload);
      throw toError(error, 'Impossible de valider les notes du groupe.');
    }
  });
  },
  rejectNotesGroup: async (payload) => {
    return withAdminDashboardRefresh(async () => {
      const normalizedPayload = normalizeGroupValidationPayload(payload);
    try {
      console.debug('[api] POST /admin/notes/reject-group', normalizedPayload);
      const response = await api.post('/admin/notes/reject-group', normalizedPayload);
      return response.data;
    } catch (error) {
      logApiValidationError('POST /admin/notes/reject-group', error, normalizedPayload);
      throw toError(error, 'Impossible de rejeter les notes du groupe.');
    }
  });
  },
  updateManagedNote: async (noteId, payload) => {
    return withAdminDashboardRefresh(async () => {
      const response = await api.patch(`/admin/notes/${noteId}`, payload);
      return response.data;
    });
  },
  sendNotification: async (payload) => {
    const response = await api.post('/admin/notifications', payload);
    return response.data;
  },
};

export const directeurApi = {
  workflowNotes: async (params = {}) => {
    const response = await api.get('/directeur/notes/workflow', { params });
    return response.data;
  },
  validateNotesGroup: async (payload) => {
    const normalizedPayload = normalizeGroupValidationPayload(payload);
    try {
      console.debug('[api] POST /directeur/notes/validate-group', normalizedPayload);
      const response = await api.post('/directeur/notes/validate-group', normalizedPayload);
      return response.data;
    } catch (error) {
      logApiValidationError('POST /directeur/notes/validate-group', error, normalizedPayload);
      throw toError(error, 'Impossible de valider les notes du groupe.');
    }
  },
  rejectNotesGroup: async (payload) => {
    const normalizedPayload = normalizeGroupValidationPayload(payload);
    try {
      console.debug('[api] POST /directeur/notes/reject-group', normalizedPayload);
      const response = await api.post('/directeur/notes/reject-group', normalizedPayload);
      return response.data;
    } catch (error) {
      logApiValidationError('POST /directeur/notes/reject-group', error, normalizedPayload);
      throw toError(error, 'Impossible de rejeter les notes du groupe.');
    }
  },
  updateManagedNote: async (noteId, payload) => {
    const response = await api.patch(`/directeur/notes/${noteId}`, payload);
    return response.data;
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
  saveNotes: async (payload) => {
    const response = await api.post('/professeur/notes', payload);
    return response.data;
  },
  saveNotesBatch: async (payload) => {
    const response = await api.post('/professeur/notes/batch', payload);
    return response.data;
  },
  submitNotesBatch: async (payload) => {
    const response = await api.post('/professeur/notes/submit', payload);
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
  stagiaires: async (params = {}) => {
    const response = await api.get('/professeur/stagiaires', { params });
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
  transcript: async () => {
    const response = await api.get('/stagiaire/releve-de-notes');
    return response.data;
  },
  schedule: async () => {
    const response = await api.get('/stagiaire/schedule');
    return response.data;
  },
  emploiDuTemps: async () => {
    const response = await api.get('/stagiaire/emploi-du-temps');
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

export const profileApi = {
  get: async (role) => {
    const response = await api.get(`/${role}/profile`);
    return response.data;
  },
  update: async (role, payload) => {
    const formData = payload instanceof FormData ? payload : new FormData();

    if (!(payload instanceof FormData)) {
      Object.entries(payload || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
    }

    formData.set('_method', 'PUT');

    const response = await api.post(`/${role}/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
