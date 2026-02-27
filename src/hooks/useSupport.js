import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportAPI } from '../api/support';

// Teacher: own tickets
export const useMyTickets = () => {
  return useQuery({
    queryKey: ['myTickets'],
    queryFn: () => supportAPI.getTickets(),
    select: (data) => data.data,
  });
};

// SUPERUSER: all tickets with filters
export const useAllTickets = (filters = {}) => {
  return useQuery({
    queryKey: ['allTickets', filters],
    queryFn: () => supportAPI.getTickets(filters),
    select: (data) => data.data,
  });
};

// Single ticket with full thread
export const useTicket = (id) => {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => supportAPI.getTicket(id),
    enabled: !!id,
    select: (data) => data.data,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => supportAPI.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
  });
};

export const useReplyToTicket = (ticketId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message) => supportAPI.replyToTicket(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => supportAPI.updateStatus(id, status),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
};
