import apiClient from './client';

export const reportsAPI = {
  // Get student report (By Learner)
  getStudentReport: async (studentId, params = {}) => {
    return apiClient.get(`/reports/student/${studentId}`, { params });
  },

  // Get strand report (By Strand)
  getStrandReport: async (strandId, params = {}) => {
    return apiClient.get(`/reports/strand/${strandId}`, { params });
  },

  // Get outcome report (By SCO)
  getOutcomeReport: async (outcomeId, params = {}) => {
    return apiClient.get(`/reports/outcome/${outcomeId}`, { params });
  },

  // Get class summary
  getClassSummary: async (classId, params = {}) => {
    return apiClient.get(`/reports/class/${classId}/summary`, { params });
  },

  // Get school summary
  getSchoolSummary: async (schoolId, params = {}) => {
    return apiClient.get(`/reports/school/${schoolId}/summary`, { params });
  },

  // Export report to CSV or PDF
  exportReport: async (reportType, format, reportData, options = {}) => {
    const response = await apiClient.post(
      '/reports/export',
      { reportType, format, reportData, options },
      { responseType: 'blob' }
    );
    return response;
  },

  // Helper to download exported file
  downloadReport: async (reportType, format, reportData, options = {}) => {
    const response = await reportsAPI.exportReport(reportType, format, reportData, options);

    // Create blob and download
    const blob = new Blob([response.data], {
      type: format === 'csv' ? 'text/csv' : 'application/pdf',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${Date.now()}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
