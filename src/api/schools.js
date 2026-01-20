import apiClient from './client';

export const schoolsAPI = {
  // Get all countries
  getCountries: async () => {
    return apiClient.get('/schools/countries');
  },

  // Get all schools
  getAll: async (params = {}) => {
    return apiClient.get('/schools', { params });
  },

  // Get single school
  getById: async (id) => {
    return apiClient.get(`/schools/${id}`);
  },

  // Create school
  create: async (schoolData) => {
    return apiClient.post('/schools', schoolData);
  },

  // Get academic terms for a school
  getSchoolTerms: async (schoolId) => {
    return apiClient.get(`/schools/${schoolId}/terms`);
  },

  // Create academic term
  createTerm: async (termData) => {
    return apiClient.post('/schools/terms', termData);
  },
};
