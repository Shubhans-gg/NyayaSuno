import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nyayasuno_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response error handler
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // If unauthorized and has expired token, clear it
    if (localStorage.getItem('nyayasuno_token')) {
      localStorage.removeItem('nyayasuno_token');
      localStorage.removeItem('nyayasuno_user');
    }
  }
  return Promise.reject(error);
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const chatAPI = {
  sendMessage: (data) => api.post('/chat', data),
  sendVoice: (formData) => api.post('/chat/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getConversations: () => api.get('/conversations'),
  getConversation: (id) => api.get(`/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/conversations/${id}`),
  reportAnswer: (data) => api.post('/report', data),
};

export const documentsAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getById: (id) => api.get(`/documents/${id}`),
  askQuestion: (data) => api.post('/documents/analyze-question', data),
};

export const legalAPI = {
  getSources: () => api.get('/legal/sources'),
  getCategories: () => api.get('/legal/categories'),
  getHelplines: () => api.get('/legal/helplines'),
};

export default api;

