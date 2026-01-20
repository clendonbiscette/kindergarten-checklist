import apiClient from './client';

export const assessmentsAPI = {
  // Create assessment
  create: async (assessmentData) => {
    return apiClient.post('/assessments', assessmentData);
  },

  // Get assessments for a student
  getStudentAssessments: async (studentId, params = {}) => {
    return apiClient.get(`/assessments/student/${studentId}`, { params });
  },

  // Get assessment history for a specific outcome and student
  getOutcomeHistory: async (studentId, outcomeId) => {
    return apiClient.get(`/assessments/student/${studentId}/outcome/${outcomeId}`);
  },

  // Get assessments by term (for class reports)
  getTermAssessments: async (termId, params = {}) => {
    return apiClient.get(`/assessments/term/${termId}`, { params });
  },

  // Update assessment
  update: async (id, data) => {
    return apiClient.put(`/assessments/${id}`, data);
  },

  // Delete assessment
  delete: async (id) => {
    return apiClient.delete(`/assessments/${id}`);
  },
};
