import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../api/admin';

// Users
export const useAdminUsers = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminAPI.getUsers(params),
    select: (data) => data.data,
  });
};

export const useAdminUser = (id) => {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminAPI.getUser(id),
    enabled: !!id,
    select: (data) => data.data,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: ({ id, newPassword }) => adminAPI.resetUserPassword(id, newPassword),
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAPI.deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

// School assignments
export const useAssignUserToSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, schoolId }) => adminAPI.assignUserToSchool(userId, schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schools'] });
    },
  });
};

export const useRemoveUserFromSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, schoolId }) => adminAPI.removeUserFromSchool(userId, schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schools'] });
    },
  });
};

// Schools
export const useAdminSchools = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'schools', params],
    queryFn: () => adminAPI.getSchools(params),
    select: (data) => data.data,
  });
};

export const useCreateSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAPI.createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'schools'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['publicSchools'] });
    },
  });
};

// Statistics
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminAPI.getStats,
    select: (data) => data.data,
  });
};
