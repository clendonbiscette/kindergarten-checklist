import apiClient from './client';

export const supportAPI = {
  createTicket: (data) => apiClient.post('/support/tickets', data),
  getTickets: (params) => apiClient.get('/support/tickets', { params }),
  getTicket: (id) => apiClient.get(`/support/tickets/${id}`),
  replyToTicket: (id, message) => apiClient.post(`/support/tickets/${id}/reply`, { message }),
  updateStatus: (id, status) => apiClient.patch(`/support/tickets/${id}/status`, { status }),
  publicContact: (data) => apiClient.post('/support/contact', data),
};
