import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsAPI } from '../api/reports';

// Get student report (By Learner)
export const useStudentReport = (studentId, filters = {}) => {
  return useQuery({
    queryKey: ['reports', 'student', studentId, filters],
    queryFn: () => reportsAPI.getStudentReport(studentId, filters),
    enabled: !!studentId,
    select: (data) => data.data,
  });
};

// Get detailed student-subject report (matching template format with date columns)
export const useStudentSubjectReport = (studentId, subjectId, filters = {}) => {
  return useQuery({
    queryKey: ['reports', 'student-subject', studentId, subjectId, filters],
    queryFn: () => reportsAPI.getStudentSubjectReport(studentId, subjectId, filters),
    enabled: !!(studentId && subjectId),
    select: (data) => data.data,
  });
};

// Get strand report (By Strand)
export const useStrandReport = (strandId, filters = {}) => {
  return useQuery({
    queryKey: ['reports', 'strand', strandId, filters],
    queryFn: () => reportsAPI.getStrandReport(strandId, filters),
    enabled: !!(strandId && filters.classId),
    select: (data) => data.data,
  });
};

// Get outcome report (By SCO)
export const useOutcomeReport = (outcomeId, filters = {}) => {
  return useQuery({
    queryKey: ['reports', 'outcome', outcomeId, filters],
    queryFn: () => reportsAPI.getOutcomeReport(outcomeId, filters),
    enabled: !!(outcomeId && filters.classId),
    select: (data) => data.data,
  });
};

// Get class summary
export const useClassSummary = (classId, filters = {}) => {
  return useQuery({
    queryKey: ['reports', 'class', classId, filters],
    queryFn: () => reportsAPI.getClassSummary(classId, filters),
    enabled: !!classId,
    select: (data) => data.data,
  });
};

// Get school summary
export const useSchoolSummary = (schoolId, filters = {}) => {
  return useQuery({
    queryKey: ['reports', 'school', schoolId, filters],
    queryFn: () => reportsAPI.getSchoolSummary(schoolId, filters),
    enabled: !!schoolId,
    select: (data) => data.data,
  });
};

// Export report mutation
export const useExportReport = () => {
  return useMutation({
    mutationFn: ({ reportType, format, reportData, options }) =>
      reportsAPI.downloadReport(reportType, format, reportData, options),
  });
};
