import api from './api';

export const createRestorePoint = async (restorePointData) => {
  try {
    const response = await api.post('/restore/create', restorePointData);
    return response.data;
  } catch (error) {
    console.error('Create restore point error:', error);
    throw error.response?.data || error;
  }
};

export const searchRestorePoints = async (query = '', limit = 20) => {
  try {
    const params = { limit };
    if (query) {
      params.query = query;
    }
    
    const response = await api.get('/restore/search', { params });
    return response.data;
  } catch (error) {
    console.error('Search restore points error:', error);
    throw error.response?.data || error;
  }
};

export const loadRestorePoint = async (id) => {
  try {
    const response = await api.post(`/restore/load/${id}`);
    return response.data;
  } catch (error) {
    console.error('Load restore point error:', error);
    throw error.response?.data || error;
  }
};

export const getRestorePoints = async (limit = 20) => {
  try {
    const response = await api.get('/restore', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('Get restore points error:', error);
    throw error.response?.data || error;
  }
};

export const getRestorePointDetails = async (id) => {
  try {
    const response = await api.get(`/restore/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get restore point details error:', error);
    throw error.response?.data || error;
  }
};

export const deleteRestorePoint = async (id) => {
  try {
    const response = await api.delete(`/restore/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete restore point error:', error);
    throw error.response?.data || error;
  }
};