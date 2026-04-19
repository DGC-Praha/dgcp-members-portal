import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';
const MEMBERS_API_BASE = import.meta.env.VITE_MEMBERS_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Second axios instance for dgcp-members-api (club-specific data).
// Shares the bearer token with apiClient — both backends verify the same
// tagovacka-issued JWT. No separate refresh logic: when the members-api
// returns 401, the next apiClient (tagovacka) call will trigger the shared
// refresh flow.
const membersApiClient = axios.create({
  baseURL: MEMBERS_API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// --- Token refresh logic ---

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('oauth_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const res = await axios.post(`${API_BASE}/api/token/refresh`, {
    refresh_token: refreshToken,
  });

  const newAccessToken: string = res.data.token;
  const newRefreshToken: string | undefined = res.data.refresh_token;

  localStorage.setItem('oauth_token', newAccessToken);
  if (newRefreshToken) {
    localStorage.setItem('oauth_refresh_token', newRefreshToken);
  }

  return newAccessToken;
}

// --- Interceptors ---

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('oauth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Same bearer-token interceptor for membersApiClient. It does NOT do refresh;
// refresh is delegated to apiClient's interceptor since both share the token.
membersApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('oauth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      // Non-401 error, or already retried — reject
      if (error.response?.status === 401) {
        localStorage.removeItem('oauth_token');
        localStorage.removeItem('oauth_refresh_token');
        window.dispatchEvent(new Event('auth:logout'));
      }
      return Promise.reject(error);
    }

    // Don't try to refresh if there's no refresh token
    if (!localStorage.getItem('oauth_refresh_token')) {
      localStorage.removeItem('oauth_token');
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('oauth_token');
      localStorage.removeItem('oauth_refresh_token');
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const api = {
  getMe: () => apiClient.get('/api/me'),
  getMembers: () => apiClient.get('/api/members'),
  getMemberDetail: (iDiscGolfId: number) => apiClient.get(`/api/members/${iDiscGolfId}`),
  getPlayerAchievements: (iDiscGolfId: number, year?: number) =>
    apiClient.get(`/api/members/${iDiscGolfId}/achievements`, { params: { year } }),
  getRecentAchievements: (page?: number) =>
    apiClient.get('/api/recent-achievements', { params: { page } }),
  getUpcomingTournaments: () => apiClient.get('/api/tournaments/upcoming'),
  getMyTournaments: () => apiClient.get('/api/tournaments/my'),
  getMyWatchdogSubscriptions: () => apiClient.get('/api/registration-watchdog/subscriptions'),
  getAllTournaments: (params: {
    region?: string[];
    cadgTier?: string[];
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

// --- dgcp-members-api (club-specific data) ---

export type Sex = 'male' | 'female';

export type ClubRole = 'member' | 'admin';

export interface ClubMembershipSummary {
  clubSlug: string;
  clubName: string;
  role: ClubRole;
  active: boolean;
  joinedAt: string;
}

export interface ClubMember {
  id: number;
  iDiscGolfId: number;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  role?: ClubRole;
  firstName: string | null;
  lastName: string | null;
  sex: Sex | null;
  dateOfBirth: string | null;
  identificationNumber: string | null;
  address: string | null;
  memberSince: string | null;
  activeMember: boolean;
  clubMemberships?: ClubMembershipSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ClubMemberUpdate {
  phone?: string | null;
  isAdmin?: boolean;
  role?: ClubRole;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  sex?: Sex | null;
  dateOfBirth?: string | null;
  identificationNumber?: string | null;
  address?: string | null;
  memberSince?: string | null;
  activeMember?: boolean;
}

export const membersApi = {
  getMe: () => membersApiClient.get<ClubMember>('/api/me'),
  updateMe: (data: { phone?: string | null }) =>
    membersApiClient.patch<ClubMember>('/api/me', data),
  listClubMembers: () =>
    membersApiClient.get<ClubMember[]>('/api/admin/club-members'),
  updateClubMember: (iDiscGolfId: number, data: ClubMemberUpdate) =>
    membersApiClient.patch<ClubMember>(
      `/api/admin/club-members/${iDiscGolfId}`,
      data,
    ),
  syncMembers: () =>
    membersApiClient.post<{ total: number; created: number; untouched: number }>(
      '/api/admin/sync-members',
    ),
};

export default apiClient;
