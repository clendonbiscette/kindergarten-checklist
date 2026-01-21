import apiClient from './client';

// Helper to filter out undefined/null values before creating query string
const cleanParams = (params) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
};

export const adminAPI = {
  // User management
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(cleanParams(params)).toString();
    return apiClient.get(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUser: async (id) => {
    return apiClient.get(`/admin/users/${id}`);
  },

  createUser: async (userData) => {
    return apiClient.post('/admin/users', userData);
  },

  updateUser: async (id, data) => {
    return apiClient.put(`/admin/users/${id}`, data);
  },

  resetUserPassword: async (id, newPassword) => {
    return apiClient.post(`/admin/users/${id}/reset-password`, { newPassword });
  },

  deactivateUser: async (id) => {
    return apiClient.delete(`/admin/users/${id}`);
  },

  // User-school assignments
  assignUserToSchool: async (userId, schoolId) => {
    return apiClient.post(`/admin/users/${userId}/assign-school`, { schoolId });
  },

  removeUserFromSchool: async (userId, schoolId) => {
    return apiClient.delete(`/admin/users/${userId}/schools/${schoolId}`);
  },

  // Schools
  getSchools: async (params = {}) => {
    const queryString = new URLSearchParams(cleanParams(params)).toString();
    return apiClient.get(`/admin/schools${queryString ? `?${queryString}` : ''}`);
  },

  createSchool: async (schoolData) => {
    return apiClient.post('/schools', schoolData);
  },

  // Statistics
  getStats: async () => {
    return apiClient.get('/admin/stats');
  },
};
