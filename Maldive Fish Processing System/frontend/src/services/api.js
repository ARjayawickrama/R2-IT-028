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

export default axiosInstance;
