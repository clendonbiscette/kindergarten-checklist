import apiClient from './client';

export const classesAPI = {
  // Get all classes
  getAll: async (params = {}) => {
    return apiClient.get('/classes', { params });
  },

  // Get single class with students
  getById: async (id) => {
    return apiClient.get(`/classes/${id}`);
  },

  // Create class
  create: async (classData) => {
    return apiClient.post('/classes', classData);
  },

  // Update class
  update: async (id, classData) => {
    return apiClient.put(`/classes/${id}`, classData);
  },

  // Delete class
  delete: async (id) => {
    return apiClient.delete(`/classes/${id}`);
  },

  // Add student to class
  addStudent: async (classId, studentId) => {
    return apiClient.post(`/classes/${classId}/students`, { studentId });
  },

  // Remove student from class
  removeStudent: async (classId, studentId) => {
    return apiClient.delete(`/classes/${classId}/students/${studentId}`);
  },
};
