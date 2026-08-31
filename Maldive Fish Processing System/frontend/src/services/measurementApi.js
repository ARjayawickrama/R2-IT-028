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

// Create a new measurement
export const createMeasurement = async (measurementData) => {
  try {
    const response = await axiosInstance.post('/measurements', measurementData);
    return response.data;
  } catch (error) {
    console.error('Error creating measurement:', error);
    throw error;
  }
};

// Get measurements by batch ID
export const getMeasurementsByBatch = async (batchId) => {
  try {
    const response = await axiosInstance.get(`/measurements/batch/${batchId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching measurements:', error);
    throw error;
  }
};

// Get measurements by session ID
export const getMeasurementsBySession = async (sessionId) => {
  try {
    const response = await axiosInstance.get(`/measurements/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session measurements:', error);
    throw error;
  }
};

// Get all measurements with optional filters
export const getAllMeasurements = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.batchId) params.append('batchId', filters.batchId);
    if (filters.sessionId) params.append('sessionId', filters.sessionId);
    if (filters.readingType) params.append('readingType', filters.readingType);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const queryString = params.toString();
    const url = queryString ? `/measurements?${queryString}` : '/measurements';
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching measurements:', error);
    throw error;
  }
};

// Get single measurement by ID
export const getMeasurementById = async (id) => {
  try {
    const response = await axiosInstance.get(`/measurements/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching measurement:', error);
    throw error;
  }
};

// Delete a measurement
export const deleteMeasurement = async (id) => {
  try {
    const response = await axiosInstance.delete(`/measurements/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting measurement:', error);
    throw error;
  }
};

// Delete all measurements for a session
export const deleteSessionMeasurements = async (sessionId) => {
  try {
    const response = await axiosInstance.delete(`/measurements/session/${sessionId}/all`);
    return response.data;
  } catch (error) {
    console.error('Error deleting session measurements:', error);
    throw error;
  }
};

// Update a measurement
export const updateMeasurement = async (id, updateData) => {
  try {
    const response = await axiosInstance.put(`/measurements/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating measurement:', error);
    throw error;
  }
};
