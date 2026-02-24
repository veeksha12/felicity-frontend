import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page to allow login errors to show
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Events API
export const eventsAPI = {
  browse: (params) => api.get('/events/browse', { params }),
  getById: (id) => api.get(`/events/${id}`),
  getTrending: () => api.get('/events/trending'),

  // Organizer only
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  updateStatus: (id, status) => api.patch(`/events/${id}/status`, { status }),
  getMyEvents: () => api.get('/events/organizer/my-events'),
  getParticipants: (id) => api.get(`/events/${id}/participants`),
  exportParticipants: (id) => api.get(`/events/${id}/export-csv`, { responseType: 'blob' }),
};

// Registrations API
export const registrationsAPI = {
  register: (data) => api.post('/registrations/register', data),
  getMyEvents: () => api.get('/registrations/my-events'),
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  updatePaymentStatus: (id, status) => api.patch(`/registrations/${id}/payment-status`, { paymentStatus: status }),
  getTicketDetails: (ticketId) => api.get(`/registrations/ticket/${ticketId}`),
  getRegistrationById: (id) => api.get(`/registrations/${id}`),
  cancel: (id) => api.patch(`/registrations/cancel/${id}`),
};

// Users API
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

  // Onboarding endpoints
  getOnboardingOptions: () => api.get('/users/onboarding-options'),
  completeOnboarding: (data) => api.post('/users/onboarding/complete', data),
  getRecommendedEvents: () => api.get('/users/recommended-events'),
};

// Admin API
export const adminAPI = {
  createOrganizer: (data) => api.post('/admin/organizers', data),
  getAllOrganizers: () => api.get('/admin/organizers'),
  manageOrganizer: (id, action) => api.put(`/admin/organizers/${id}/manage`, { action }),
  deleteOrganizer: (id) => api.delete(`/admin/organizers/${id}`, { data: { action: 'delete' } }),
  getOrganizerStats: () => api.get('/admin/organizer-stats'),
  resetUserPassword: (data) => api.post('/admin/reset-password', data),
};

// Attendance API
export const attendanceAPI = {
  scanQR: (data) => api.post('/attendance/scan', data),
  manualOverride: (data) => api.post('/attendance/manual', data),
  getDashboard: (eventId) => api.get(`/attendance/dashboard/${eventId}`),
  exportCSV: (eventId) => api.get(`/attendance/export/${eventId}`, { responseType: 'blob' }),
};

// Teams API
export const teamsAPI = {
  create: (data) => api.post('/teams', data),
  getMyTeams: () => api.get('/teams/my-teams'),
  getByInviteCode: (code) => api.get(`/teams/${code}`),
  join: (data) => api.post('/teams/join', data),
  leave: (id) => api.delete(`/teams/${id}/leave`),
  disband: (id) => api.delete(`/teams/${id}`),
};

// Password Reset API
export const passwordResetAPI = {
  // Organizer
  requestReset: (data) => api.post('/password-reset/request', data),
  getMyRequests: () => api.get('/password-reset/my-requests'),

  // Admin
  getAllRequests: (params) => api.get('/password-reset/requests', { params }),
  reviewRequest: (data) => api.post('/password-reset/review', data),
  markViewed: (requestId) => api.post(`/password-reset/mark-viewed/${requestId}`),
};

// Chat API
export const chatAPI = {
  getHistory: (teamId) => api.get(`/chat/history/${teamId}`),
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;