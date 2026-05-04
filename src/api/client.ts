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

export async function refreshAccessToken(): Promise<string> {
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

export interface TagovackaMemberDetailMembership {
  id: number;
  tagNumber: number | null;
  role: string;
  active: boolean;
  joinedAt: string;
}

export interface TagovackaMemberDetail {
  player: {
    name: string;
    avatarUrl: string | null;
    iDiscGolfId: number;
    pdgaNumber: number | null;
    iDiscGolfRating: number | null;
    pdgaRating: number | null;
    cadgMembershipActive: boolean | null;
    pdgaMembershipActive: boolean | null;
  };
  membership: TagovackaMemberDetailMembership;
  tagStats: {
    currentTag: number | null;
    bestTag: number | null;
    totalExchanges: number;
    wins: number;
    losses: number;
    longestHoldDays: number;
  };
}

export const api = {
  getMe: () => apiClient.get('/api/me'),
  getMembers: () => apiClient.get('/api/members'),
  getMemberDetail: (iDiscGolfId: number) => apiClient.get(`/api/members/${iDiscGolfId}`),
  manualTransfer: (data: {
    clubId: number;
    transfers: { membershipId: number; newTagNumber: number }[];
    note?: string;
  }) => apiClient.post<{ id: number; message: string }>('/api/manual-transfer', data),
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

export interface ClubMemberBasic {
  id: number;
  iDiscGolfId: number | null;
  firstName: string | null;
  lastName: string | null;
  membershipActive: boolean;
}

export interface ClubMember {
  id: number;
  iDiscGolfId: number | null;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  isSystemAdmin?: boolean;
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
  lastSeenAt: string | null;
}

export type WebhookOutcome =
  | 'accepted'
  | 'duplicate'
  | 'invalid_signature'
  | 'malformed'
  | 'processing_error';

export interface WebhookLogSummary {
  id: number;
  receivedAt: string;
  eventId: string | null;
  eventType: string | null;
  outcome: WebhookOutcome;
  httpStatus: number;
  signatureValid: boolean;
  sourceIp: string | null;
  processingMs: number | null;
}

export interface WebhookLogDetail extends WebhookLogSummary {
  signatureFailureReason: string | null;
  processingError: string | null;
  payloadRaw: string;
  payloadJson: Record<string, unknown> | null;
}

export interface WebhookLogPage {
  items: WebhookLogSummary[];
  nextCursor: number | null;
}

export interface QueueCounts {
  pending: number;
  scheduled: number;
  inFlight: number;
  failed: number;
}

export interface FailedMessage {
  id: string | null;
  messageClass: string;
  messagePreview: string;
  bus: string | null;
  failedAt: string | null;
  errorClass: string | null;
  errorMessage: string | null;
  errorCode: number | null;
}

export interface QueuedMessage {
  id: string | null;
  messageClass: string;
  messagePreview: string;
  bus: string | null;
  retryCount: number;
  redeliveredAt: string | null;
  availableAt: string | null;
}

export interface QueueSummary {
  counts: QueueCounts;
  oldestPendingAt: string | null;
  failed: FailedMessage[];
  queued: QueuedMessage[];
}

export interface RecomputeResult {
  status: 'done' | 'dispatched';
  iDiscGolfId?: number;
  year?: number;
  dispatched?: number;
  seasons?: number[];
}

export interface ClubMemberUpdate {
  phone?: string | null;
  isAdmin?: boolean;
  role?: ClubRole;
  email?: string | null;
  iDiscGolfId?: number | null;
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
  listMembersBasic: () =>
    membersApiClient.get<ClubMemberBasic[]>('/api/club-members'),
  getClubMember: (iDiscGolfId: number) =>
    membersApiClient.get<ClubMember>(`/api/admin/club-members/${iDiscGolfId}`),
  updateClubMember: (iDiscGolfId: number, data: ClubMemberUpdate) =>
    membersApiClient.patch<ClubMember>(
      `/api/admin/club-members/${iDiscGolfId}`,
      data,
    ),
  getClubMemberById: (id: number) =>
    membersApiClient.get<ClubMember>(`/api/admin/club-members/by-id/${id}`),
  updateClubMemberById: (id: number, data: ClubMemberUpdate) =>
    membersApiClient.patch<ClubMember>(
      `/api/admin/club-members/by-id/${id}`,
      data,
    ),
  getPlayerAchievements: (iDiscGolfId: number, year?: number) =>
    membersApiClient.get(`/api/members/${iDiscGolfId}/achievements`, { params: { year } }),
  getRecentAchievements: (page?: number, year?: number) =>
    membersApiClient.get('/api/recent-achievements', { params: { page, year } }),
  getAdminMemberAchievements: (iDiscGolfId: number, year?: number) =>
    membersApiClient.get<AdminMemberAchievementsResponse>(
      `/api/admin/club-members/${iDiscGolfId}/achievements`,
      { params: { year } },
    ),
  getAdminMemberAchievementsById: (id: number, year?: number) =>
    membersApiClient.get<AdminMemberAchievementsResponse>(
      `/api/admin/club-members/by-id/${id}/achievements`,
      { params: { year } },
    ),
  getAchievementsLeaderboard: (year?: number) =>
    membersApiClient.get<LeaderboardResponse>('/api/achievements/leaderboard', { params: { year } }),
  listWebhookLog: (params: {
    cursor?: number | null;
    limit?: number;
    eventType?: string;
    outcome?: WebhookOutcome | '';
  } = {}) =>
    membersApiClient.get<WebhookLogPage>('/api/admin/system/webhook-log', {
      params: {
        cursor: params.cursor ?? undefined,
        limit: params.limit,
        eventType: params.eventType || undefined,
        outcome: params.outcome || undefined,
      },
    }),
  getWebhookLogEntry: (id: number) =>
    membersApiClient.get<WebhookLogDetail>(`/api/admin/system/webhook-log/${id}`),
  getQueueSummary: () =>
    membersApiClient.get<QueueSummary>('/api/admin/system/queue'),
  retryFailedMessage: (id: string) =>
    membersApiClient.post(`/api/admin/system/queue/failed/${id}/retry`),
  removeFailedMessage: (id: string) =>
    membersApiClient.delete(`/api/admin/system/queue/failed/${id}`),
  recomputePlayer: (iDiscGolfId: number, year?: number) =>
    membersApiClient.post<RecomputeResult>('/api/admin/system/recompute', {
      target: 'player',
      iDiscGolfId,
      year,
    }),
  recomputeSeason: (year: number) =>
    membersApiClient.post<RecomputeResult>('/api/admin/system/recompute', {
      target: 'season',
      year,
    }),
  recomputeAll: () =>
    membersApiClient.post<RecomputeResult>('/api/admin/system/recompute', {
      target: 'all',
    }),
  setAdminMemberAchievement: (
    iDiscGolfId: number,
    key: string,
    data: { progress: number; year?: number },
  ) =>
    membersApiClient.put<AdminMemberAchievement>(
      `/api/admin/club-members/${iDiscGolfId}/achievements/${key}`,
      { progress: data.progress },
      { params: { year: data.year } },
    ),
  setAdminMemberAchievementById: (
    id: number,
    key: string,
    data: { progress: number; year?: number },
  ) =>
    membersApiClient.put<AdminMemberAchievement>(
      `/api/admin/club-members/by-id/${id}/achievements/${key}`,
      { progress: data.progress },
      { params: { year: data.year } },
    ),
};

export interface AdminAchievementTier {
  tier: string;
  threshold: number;
  earned: boolean;
  earnedAt: string | null;
}

export interface AdminMemberAchievement {
  key: string;
  name: string;
  emoji: string;
  description: string;
  manual: boolean;
  progress: number;
  tiers: AdminAchievementTier[];
}

export interface AdminMemberAchievementsResponse {
  year: number;
  achievements: AdminMemberAchievement[];
}

export interface LeaderboardEarner {
  iDiscGolfId: number;
  name: string;
  earnedAt: string;
}

export interface LeaderboardItem {
  achievementKey: string;
  achievementName: string;
  achievementEmoji: string;
  achievementDescription: string;
  manual: boolean;
  tier: string;
  threshold: number;
  earnedCount: number;
  rarityPercent: number;
  earners: LeaderboardEarner[];
}

export interface LeaderboardResponse {
  year: number;
  totalMembers: number;
  items: LeaderboardItem[];
}

export default apiClient;
