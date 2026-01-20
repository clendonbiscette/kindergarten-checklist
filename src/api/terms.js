import apiClient from './client';

export const termsAPI = {
  // Get all terms for a school
  getAll: async (params = {}) => {
    return apiClient.get('/terms', { params });
  },

  // Get single term
  getById: async (id) => {
    return apiClient.get(`/terms/${id}`);
  },

  // Create term
  create: async (termData) => {
    return apiClient.post('/terms', termData);
  },

  // Update term
  update: async (id, data) => {
    return apiClient.put(`/terms/${id}`, data);
  },

  // Delete term
  delete: async (id) => {
    return apiClient.delete(`/terms/${id}`);
  },
};
