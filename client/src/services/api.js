import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:7500';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('🔴 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    
    return response;
  },
  (error) => {
    console.error('🔴 API Response Error:', error);
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Handle forbidden
      console.error('Access forbidden');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default api;