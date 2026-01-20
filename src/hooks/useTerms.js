import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { termsAPI } from '../api/terms';

// Get all terms for a school
export const useTerms = (schoolId) => {
  return useQuery({
    queryKey: ['terms', schoolId],
    queryFn: () => termsAPI.getAll({ schoolId }),
    enabled: !!schoolId,
    select: (data) => data.data,
  });
};

// Get single term
export const useTerm = (id) => {
  return useQuery({
    queryKey: ['term', id],
    queryFn: () => termsAPI.getById(id),
    enabled: !!id,
    select: (data) => data.data,
  });
};

// Create term
export const useCreateTerm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (termData) => termsAPI.create(termData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['terms', variables.schoolId]);
    },
  });
};

// Update term
export const useUpdateTerm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => termsAPI.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['terms']);
      queryClient.invalidateQueries(['term', variables.id]);
    },
  });
};

// Delete term
export const useDeleteTerm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => termsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['terms']);
    },
  });
};
