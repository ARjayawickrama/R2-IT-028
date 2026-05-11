import axios from 'axios';

const AI_API_BASE_URL = 'http://localhost:8000';

const aiAxiosInstance = axios.create({
  baseURL: AI_API_BASE_URL,
  timeout: 30000, 
});

export const aiService = {
  // Health check for AI backend
  healthCheck: () => aiAxiosInstance.get('/health'),
  
  // Analyze fish image using AI model
  analyzeImage: (formData) => 
    aiAxiosInstance.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export default aiAxiosInstance;
