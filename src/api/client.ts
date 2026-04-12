import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('oauth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oauth_token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export const api = {
  getMe: () => apiClient.get('/api/me'),
  getMembers: () => apiClient.get('/api/members'),
  getUpcomingTournaments: () => apiClient.get('/api/tournaments/upcoming'),
  getMyTournaments: () => apiClient.get('/api/tournaments/my'),
  getMyWatchdogSubscriptions: () => apiClient.get('/api/registration-watchdog/subscriptions'),
  getAllTournaments: (params: {
    region?: string;
    cadgTier?: string;
    pdga?: number;
    registration?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get('/api/tournaments', { params }),
  getTournamentFilterOptions: () => apiClient.get('/api/tournaments/filter-options'),
  getWatchdogStatus: (tournamentIdgId: number) =>
    apiClient.get(`/api/registration-watchdog/status/${tournamentIdgId}`),
  watchdogSubscribe: (data: {
    tournamentIdgId: number;
    phaseNumber: number;
    notifyMinutesBefore: number;
  }) => apiClient.post('/api/registration-watchdog/subscribe', data),
  watchdogUnsubscribePhase: (data: {
    tournamentIdgId: number;
    phaseNumber: number;
  }) => apiClient.post('/api/registration-watchdog/unsubscribe-phase', data),
};

export default apiClient;
