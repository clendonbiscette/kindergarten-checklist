import apiClient from './client';

export const curriculumAPI = {
  // Get all subjects
  getSubjects: async () => {
    return apiClient.get('/curriculum/subjects');
  },

  // Get all strands
  getStrands: async () => {
    return apiClient.get('/curriculum/strands');
  },

  // Get strands by subject
  getStrandsBySubject: async (subjectId) => {
    return apiClient.get(`/curriculum/subjects/${subjectId}/strands`);
  },

  // Get learning outcomes (with optional filtering)
  getLearningOutcomes: async (params = {}) => {
    return apiClient.get('/curriculum/outcomes', { params });
  },

  // Get single learning outcome
  getLearningOutcome: async (id) => {
    return apiClient.get(`/curriculum/outcomes/${id}`);
  },
};
