import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const authService = {
  register: (name, email, password) =>
    axiosInstance.post('/auth/register', { name, email, password }),

  login: (email, password) =>
    axiosInstance.post('/auth/login', { email, password }),

  getProfile: () =>
    axiosInstance.get('/user/profile'),
};

export const rawFishService = {
  fetchHistory: () => axiosInstance.get('/raw-fish'),
  saveAnalysis: (payload) => axiosInstance.post('/raw-fish', payload),
  deleteAssessment: (id) => axiosInstance.delete(`/raw-fish/${id}`),
};

export const qualityService = {
  analyzeImage: (formData) =>
    axiosInstance.post('/quality/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getBatches: () =>
    axiosInstance.get('/quality/batches'),

  deleteBatch: (id) =>
    axiosInstance.delete(`/quality/batches/${id}`),
};

export const dryFishService = {
  getBatches: () =>
    axiosInstance.get('/dry-fish/batches'),

  createBatch: (batch) =>
    axiosInstance.post('/dry-fish/batches', batch),

  updateBatch: (id, updates) =>
    axiosInstance.patch(`/dry-fish/batches/${id}`, updates),

  deleteAllBatches: () =>
    axiosInstance.delete('/dry-fish/batches'),
};

export const safetyService = {
  getEmailStatus: () =>
    axiosInstance.get('/safety/email-status'),

  sendTestEmail: () =>
    axiosInstance.post('/safety/test-email'),

  getHistory: () =>
    axiosInstance.get('/safety/history'),

  evaluateAlerts: (activeAlerts, heatmapPng) =>
    axiosInstance.post('/safety/alerts/evaluate', { activeAlerts, heatmapPng, deliveryMode: 'emailjs' }),

  reportEmailStatus: (incidentKeys, emailStatus) =>
    axiosInstance.patch('/safety/alerts/email-status', { incidentKeys, emailStatus }),

  acknowledgeIncident: (id) =>
    axiosInstance.patch(`/safety/history/${id}/acknowledge`),
};

export default axiosInstance;
