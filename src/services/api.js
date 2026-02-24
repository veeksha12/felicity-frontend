import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const eventsAPI = {
  browse: (params) => api.get('/events/browse', { params }),
  getById: (id) => api.get(`/events/${id}`),
  getTrending: () => api.get('/events/trending'),

  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  updateStatus: (id, status) => api.patch(`/events/${id}/status`, { status }),
  getMyEvents: () => api.get('/events/organizer/my-events'),
  getParticipants: (id) => api.get(`/events/${id}/participants`),
  exportParticipants: (id) => api.get(`/events/${id}/export-csv`, { responseType: 'blob' }),
};

export const registrationsAPI = {
  register: (data) => api.post('/registrations/register', data),
  getMyEvents: () => api.get('/registrations/my-events'),
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  updatePaymentStatus: (id, status) => api.patch(`/registrations/${id}/payment-status`, { paymentStatus: status }),
  getTicketDetails: (ticketId) => api.get(`/registrations/ticket/${ticketId}`),
  getRegistrationById: (id) => api.get(`/registrations/${id}`),
  cancel: (id) => api.patch(`/registrations/cancel/${id}`),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateParticipantProfile: (data) => api.put('/users/participant-profile', data),
  updateOrganizerProfile: (data) => api.put('/users/organizer-profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  setPreferences: (data) => api.put('/users/preferences', data),
  followClub: (data) => api.post('/users/follow', data),
  unfollowClub: (clubId) => api.delete(`/users/unfollow/${clubId}`),
  getAllOrganizers: () => api.get('/users/organizers'),
  getOrganizerById: (id) => api.get(`/users/organizers/${id}`),

  getOnboardingOptions: () => api.get('/users/onboarding-options'),
  completeOnboarding: (data) => api.post('/users/onboarding/complete', data),
  getRecommendedEvents: () => api.get('/users/recommended-events'),
};

export const adminAPI = {
  createOrganizer: (data) => api.post('/admin/organizers', data),
  getAllOrganizers: () => api.get('/admin/organizers'),
  manageOrganizer: (id, action) => api.put(`/admin/organizers/${id}/manage`, { action }),
  deleteOrganizer: (id) => api.delete(`/admin/organizers/${id}`, { data: { action: 'delete' } }),
  getOrganizerStats: () => api.get('/admin/organizer-stats'),
  resetUserPassword: (data) => api.post('/admin/reset-password', data),
};

export const attendanceAPI = {
  scanQR: (data) => api.post('/attendance/scan', data),
  manualOverride: (data) => api.post('/attendance/manual', data),
  getDashboard: (eventId) => api.get(`/attendance/dashboard/${eventId}`),
  exportCSV: (eventId) => api.get(`/attendance/export/${eventId}`, { responseType: 'blob' }),
};

export const teamsAPI = {
  create: (data) => api.post('/teams', data),
  getMyTeams: () => api.get('/teams/my-teams'),
  getByInviteCode: (code) => api.get(`/teams/${code}`),
  join: (data) => api.post('/teams/join', data),
  leave: (id) => api.delete(`/teams/${id}/leave`),
  disband: (id) => api.delete(`/teams/${id}`),
};

export const passwordResetAPI = {
  requestReset: (data) => api.post('/password-reset/request', data),
  getMyRequests: () => api.get('/password-reset/my-requests'),

  getAllRequests: (params) => api.get('/password-reset/requests', { params }),
  reviewRequest: (data) => api.post('/password-reset/review', data),
  markViewed: (requestId) => api.post(`/password-reset/mark-viewed/${requestId}`),
};

export const chatAPI = {
  getHistory: (teamId) => api.get(`/chat/history/${teamId}`),
  markAsRead: (teamId) => api.post(`/chat/read/${teamId}`),
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;