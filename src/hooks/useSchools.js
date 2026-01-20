import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsAPI } from '../api/schools';

// Get all countries
export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: () => schoolsAPI.getCountries(),
    select: (data) => data.data,
  });
};

// Get all schools
export const useSchools = (filters = {}) => {
  return useQuery({
    queryKey: ['schools', filters],
    queryFn: () => schoolsAPI.getAll(filters),
    select: (data) => data.data,
  });
};

// Get single school
export const useSchool = (id) => {
  return useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolsAPI.getById(id),
    enabled: !!id,
    select: (data) => data.data,
  });
};

// Get school terms
export const useSchoolTerms = (schoolId) => {
  return useQuery({
    queryKey: ['terms', schoolId],
    queryFn: () => schoolsAPI.getSchoolTerms(schoolId),
    enabled: !!schoolId,
    select: (data) => data.data,
  });
};

// Create school
export const useCreateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schoolData) => schoolsAPI.create(schoolData),
    onSuccess: () => {
      queryClient.invalidateQueries(['schools']);
    },
  });
};

// Create term
export const useCreateTerm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (termData) => schoolsAPI.createTerm(termData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['terms', variables.schoolId]);
    },
  });
};
