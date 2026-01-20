import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '../api/classes';

// Get all classes
export const useClasses = (filters = {}) => {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: () => classesAPI.getAll(filters),
    select: (data) => data.data,
  });
};

// Get single class
export const useClass = (id) => {
  return useQuery({
    queryKey: ['class', id],
    queryFn: () => classesAPI.getById(id),
    enabled: !!id,
    select: (data) => data.data,
  });
};

// Create class
export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classData) => classesAPI.create(classData),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
    },
  });
};

// Update class
export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => classesAPI.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['classes']);
      queryClient.invalidateQueries(['class', variables.id]);
    },
  });
};

// Delete class
export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => classesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
    },
  });
};

// Add student to class
export const useAddStudentToClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, studentId }) => classesAPI.addStudent(classId, studentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['class', variables.classId]);
      queryClient.invalidateQueries(['classes']);
      queryClient.invalidateQueries(['students']);
    },
  });
};

// Remove student from class
export const useRemoveStudentFromClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, studentId }) => classesAPI.removeStudent(classId, studentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['class', variables.classId]);
      queryClient.invalidateQueries(['classes']);
      queryClient.invalidateQueries(['students']);
    },
  });
};
