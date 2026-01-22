import apiClient from './client';

export const studentsAPI = {
  // Get all students
  getAll: async (params = {}) => {
    return apiClient.get('/students', { params });
  },

  // Get single student
  getById: async (id) => {
    return apiClient.get(`/students/${id}`);
  },

  // Create student
  create: async (studentData) => {
    return apiClient.post('/students', studentData);
  },

  // Update student
  update: async (id, data) => {
    return apiClient.put(`/students/${id}`, data);
  },

  // Delete student
  delete: async (id) => {
    return apiClient.delete(`/students/${id}`);
  },

  // Assign student to class (teachers can use this for their own classes)
  assignToClass: async (id, classId) => {
    return apiClient.patch(`/students/${id}/assign-class`, { classId });
  },
};
