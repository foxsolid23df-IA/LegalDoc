import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    mockAuthService,
    mockDocumentService,
    mockUserService,
    mockLogService
} from './mockApi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            // Manejar errores específicos
            switch (status) {
                case 401:
                    // Token expirado o inválido
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
                    break;

                case 403:
                    toast.error('No tiene permisos para realizar esta acción.');
                    break;

                case 404:
                    toast.error('Recurso no encontrado.');
                    break;

                case 422:
                    // Errores de validación
                    if (data.errors) {
                        data.errors.forEach(err => {
                            toast.error(`${err.field}: ${err.message}`);
                        });
                    } else {
                        toast.error(data.message || 'Error de validación');
                    }
                    break;

                case 429:
                    toast.error('Demasiadas solicitudes. Por favor intente más tarde.');
                    break;

                case 500:
                    toast.error('Error interno del servidor. Por favor contacte al administrador.');
                    break;

                default:
                    toast.error(data.message || 'Error desconocido');
            }
        } else if (error.request) {
            toast.error('No se pudo conectar con el servidor. Verifique su conexión.');
        } else {
            toast.error('Error en la solicitud');
        }

        return Promise.reject(error);
    }
);

// Detección de Modo Demo (GitHub Pages o flag local)
const isDemoMode = true; // window.location.hostname.includes('github.io') || process.env.REACT_APP_USE_MOCK === 'true';

if (isDemoMode) {
    console.log('⚠️ RUNNING IN DEMO MODE (MOCK API) ⚠️');
}

// Servicios de autenticación
export const authService = isDemoMode ? mockAuthService : {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    },

    verifyToken: async () => {
        const response = await api.get('/auth/verify');
        return response.data;
    }
};

// Servicios de documentos
export const documentService = isDemoMode ? mockDocumentService : {
    upload: async (formData) => {
        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getAll: async (params = {}) => {
        const response = await api.get('/documents', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/documents/${id}`);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/documents/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    },

    lock: async (id) => {
        const response = await api.post(`/documents/${id}/lock`);
        return response.data;
    },

    unlock: async (id, data = {}) => {
        const response = await api.post(`/documents/${id}/unlock`, data);
        return response.data;
    },

    download: async (id) => {
        const response = await api.get(`/documents/${id}/download`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getLockStatus: async (id) => {
        const response = await api.get(`/documents/${id}/lock-status`);
        return response.data;
    },

    getVersions: async (id) => {
        const response = await api.get(`/documents/${id}/versions`);
        return response.data;
    },

    share: async (id, data) => {
        const response = await api.post(`/documents/${id}/share`, data);
        return response.data;
    },

    getShares: async (id) => {
        const response = await api.get(`/documents/${id}/shares`);
        return response.data;
    },

    revokeShare: async (id, userId) => {
        const response = await api.delete(`/documents/${id}/share/${userId}`);
        return response.data;
    },

    getByCase: async (caseId, params = {}) => {
        const response = await api.get(`/documents/case/${caseId}`, { params });
        return response.data;
    }
};

// Servicios de usuarios
export const userService = isDemoMode ? mockUserService : {
    getAll: async (params = {}) => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/users', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },

    toggleStatus: async (id, active) => {
        const response = await api.put(`/users/${id}/status`, { activo: active });
        return response.data;
    },

    resetPassword: async (id, newPassword) => {
        const response = await api.put(`/users/${id}/reset-password`, { newPassword });
        return response.data;
    }
};

// Servicios de logs
export const logService = isDemoMode ? mockLogService : {
    getActivity: async (params = {}) => {
        const response = await api.get('/logs/activity', { params });
        return response.data;
    },

    getRecent: async (limit = 50) => {
        const response = await api.get('/logs/recent', { params: { limit } });
        return response.data;
    },

    getStatistics: async (params = {}) => {
        const response = await api.get('/logs/statistics', { params });
        return response.data;
    },

    getDocumentLogs: async (documentId, params = {}) => {
        const response = await api.get(`/logs/document/${documentId}`, { params });
        return response.data;
    },

    getUserLogs: async (userId, params = {}) => {
        const response = await api.get(`/logs/user/${userId}`, { params });
        return response.data;
    }
};

export default api;
