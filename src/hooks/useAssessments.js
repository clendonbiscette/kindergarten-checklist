import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentsAPI } from '../api/assessments';

// Get assessments for a student
export const useStudentAssessments = (studentId, filters = {}) => {
  return useQuery({
    queryKey: ['assessments', 'student', studentId, filters],
    queryFn: () => assessmentsAPI.getStudentAssessments(studentId, filters),
    enabled: !!studentId,
    select: (data) => data.data,
  });
};

// Get assessment history for a specific outcome
export const useOutcomeHistory = (studentId, outcomeId) => {
  return useQuery({
    queryKey: ['assessments', 'history', studentId, outcomeId],
    queryFn: () => assessmentsAPI.getOutcomeHistory(studentId, outcomeId),
    enabled: !!(studentId && outcomeId),
    select: (data) => data.data,
  });
};

// Get assessments by term
export const useTermAssessments = (termId, filters = {}) => {
  return useQuery({
    queryKey: ['assessments', 'term', termId, filters],
    queryFn: () => assessmentsAPI.getTermAssessments(termId, filters),
    enabled: !!termId,
    select: (data) => data.data,
  });
};

// Create assessment
export const useCreateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentData) => assessmentsAPI.create(assessmentData),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['assessments', 'student', variables.studentId]);
      queryClient.invalidateQueries(['assessments', 'term', variables.termId]);
      queryClient.invalidateQueries(['assessments', 'history', variables.studentId, variables.learningOutcomeId]);
    },
  });
};

// Update assessment
export const useUpdateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => assessmentsAPI.update(id, data),
    onSuccess: () => {
      // Invalidate all assessment queries to refetch
      queryClient.invalidateQueries(['assessments']);
    },
  });
};

// Delete assessment
export const useDeleteAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => assessmentsAPI.delete(id),
    onSuccess: () => {
      // Invalidate all assessment queries
      queryClient.invalidateQueries(['assessments']);
    },
  });
};
