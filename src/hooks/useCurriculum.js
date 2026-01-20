import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { curriculumAPI } from '../api/curriculum';

// Get all subjects
export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => curriculumAPI.getSubjects(),
    select: (data) => data.data,
  });
};

// Get all strands
export const useStrands = () => {
  return useQuery({
    queryKey: ['strands'],
    queryFn: () => curriculumAPI.getStrands(),
    select: (data) => data.data,
  });
};

// Get strands by subject
export const useStrandsBySubject = (subjectId) => {
  return useQuery({
    queryKey: ['strands', subjectId],
    queryFn: () => curriculumAPI.getStrandsBySubject(subjectId),
    enabled: !!subjectId,
    select: (data) => data.data,
  });
};

// Get learning outcomes
export const useLearningOutcomes = (filters = {}) => {
  return useQuery({
    queryKey: ['learningOutcomes', filters],
    queryFn: () => curriculumAPI.getLearningOutcomes(filters),
    select: (data) => data.data,
  });
};

// Get single learning outcome
export const useLearningOutcome = (id) => {
  return useQuery({
    queryKey: ['learningOutcome', id],
    queryFn: () => curriculumAPI.getLearningOutcome(id),
    enabled: !!id,
    select: (data) => data.data,
  });
};
