import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsAPI } from '../api/students';

// Get all students
export const useStudents = (filters = {}) => {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentsAPI.getAll(filters),
    select: (data) => data.data,
  });
};

// Get single student
export const useStudent = (id) => {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsAPI.getById(id),
    enabled: !!id,
    select: (data) => data.data,
  });
};

// Create student
export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentData) => studentsAPI.create(studentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
    },
  });
};

// Update student
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => studentsAPI.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['student', variables.id]);
    },
  });
};

// Delete student
export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => studentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
    },
  });
};

// Assign student to class (teachers can use this for their own classes)
export const useAssignStudentToClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, classId }) => studentsAPI.assignToClass(studentId, classId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['student', variables.studentId]);
    },
  });
};
