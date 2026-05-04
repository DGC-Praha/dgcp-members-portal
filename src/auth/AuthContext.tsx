import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Sentry } from '../sentry';
import { api, membersApi, refreshAccessToken } from '../api/client';

interface Membership {
  tagNumber: number | null;
  role: string;
  active: boolean;
  club: {
    id: number;
    name: string;
    slug: string;
    tagBadgeColor: string | null;
    tagBadgeHighlightColor: string | null;
  };
}

// Tagovacka-sourced profile data. Lazy-loaded in parallel with the members-api
// core identity — may be null briefly after login or if tagovacka is slow/down.
export interface TagovackaProfile {
  name: string;
  pdgaNumber: number | null;
  iDiscGolfRating: number | null;
  pdgaRating: number | null;
  avatarUrl: string | null;
  cadgMembershipActive: boolean | null;
  pdgaMembershipActive: boolean | null;
  // Tagovacka roles (e.g. ROLE_ADMIN). Used only for UI gating; server
  // re-checks unconditionally on every mutation.
  roles: string[];
  membership: Membership | null;
}

// Core identity is sourced from members-api. Tagovacka data arrives later and
// is exposed via `user.tagovacka` + `tagovackaLoaded`.
export interface User {
  id: number;
  iDiscGolfId: number | null;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  isSystemAdmin: boolean;
  firstName: string | null;
  lastName: string | null;
  activeMember: boolean;
  /** Preferred display name: "First Last" from members-api, else tagovacka name, else email/id. */
  displayName: string;
  tagovacka: TagovackaProfile | null;
  tagovackaLoaded: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  setTokenFromCallback: (token: string) => Promise<boolean>;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function buildDisplayName(
  firstName: string | null,
  lastName: string | null,
  tagovacka: TagovackaProfile | null,
  email: string | null,
  iDiscGolfId: number | null,
): string {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (full !== '') return full;
  if (tagovacka?.name) return tagovacka.name;
  if (email) return email;
  return iDiscGolfId != null ? `#${iDiscGolfId}` : 'anonymous';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('oauth_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(
    !!localStorage.getItem('oauth_token') || !!localStorage.getItem('oauth_refresh_token'),
  );

  const fetchUser = useCallback(async (): Promise<boolean> => {
    try {
      // If access token is gone (expired/cleared) but we still have a refresh
      // token, exchange it first so a returning user isn't bounced to login.
      if (!localStorage.getItem('oauth_token') && localStorage.getItem('oauth_refresh_token')) {
        try {
          const newToken = await refreshAccessToken();
          setToken(newToken);
        } catch {
          localStorage.removeItem('oauth_refresh_token');
          setLoading(false);
          return false;
        }
      }

      // Core identity first — if members-api is unreachable we can't render the
      // shell safely (we need isAdmin for route protection).
      const membersRes = await membersApi.getMe();
      const c = membersRes.data;
      const coreUser: User = {
        id: c.id,
        iDiscGolfId: c.iDiscGolfId,
        email: c.email,
        phone: c.phone,
        isAdmin: c.isAdmin,
        isSystemAdmin: c.isSystemAdmin === true,
        firstName: c.firstName,
        lastName: c.lastName,
        activeMember: c.activeMember,
        displayName: buildDisplayName(c.firstName, c.lastName, null, c.email, c.iDiscGolfId),
        tagovacka: null,
        tagovackaLoaded: false,
      };
      setUser(coreUser);
      setLoading(false);

      Sentry.setUser({
        id: String(coreUser.id),
        email: coreUser.email ?? undefined,
        username: coreUser.displayName,
        iDiscGolfId: coreUser.iDiscGolfId,
        isAdmin: coreUser.isAdmin,
        isSystemAdmin: coreUser.isSystemAdmin,
        activeMember: coreUser.activeMember,
      });

      // Tagovacka data arrives independently — ratings, dots, avatar, tag.
      // A failure just leaves tagovacka=null with tagovackaLoaded=true so the
      // UI can drop to neutral placeholders instead of skeletons.
      api
        .getMe()
        .then((tagRes) => {
          const d = tagRes.data;
          const m = d.memberships?.[0] ?? null;
          const tagovacka: TagovackaProfile = {
            name: d.name,
            pdgaNumber: d.pdgaNumber,
            iDiscGolfRating: d.iDiscGolfRating ?? null,
            pdgaRating: d.pdgaRating ?? null,
            avatarUrl: d.avatarUrl ?? null,
            cadgMembershipActive: d.cadgMembershipActive ?? null,
            pdgaMembershipActive: d.pdgaMembershipActive ?? null,
            roles: Array.isArray(d.roles) ? d.roles : [],
            membership: m
              ? {
                  tagNumber: m.tagNumber,
                  role: m.role,
                  active: m.active ?? true,
                  club: {
                    id: m.club.id,
                    name: m.club.name,
                    slug: m.club.slug,
                    tagBadgeColor: m.club.tagBadgeColor,
                    tagBadgeHighlightColor: m.club.tagBadgeHighlightColor,
                  },
                }
              : null,
          };
          setUser((prev) => {
            if (prev === null) return prev;
            const next = {
              ...prev,
              tagovacka,
              tagovackaLoaded: true,
              displayName: buildDisplayName(
                prev.firstName,
                prev.lastName,
                tagovacka,
                prev.email,
                prev.iDiscGolfId,
              ),
            };
            Sentry.setUser({
              id: String(next.id),
              email: next.email ?? undefined,
              username: next.displayName,
              iDiscGolfId: next.iDiscGolfId,
              isAdmin: next.isAdmin,
              isSystemAdmin: next.isSystemAdmin,
              activeMember: next.activeMember,
              clubSlug: tagovacka.membership?.club.slug ?? null,
              clubRole: tagovacka.membership?.role ?? null,
              tagNumber: tagovacka.membership?.tagNumber ?? null,
            });
            return next;
          });
        })
        .catch(() => {
          setUser((prev) =>
            prev === null ? prev : { ...prev, tagovacka: null, tagovackaLoaded: true },
          );
        });

      return true;
    } catch {
      // Clear BOTH tokens — otherwise the useEffect re-fires, refresh_token
      // gets a fresh access token that also fails verification, and we loop.
      localStorage.removeItem('oauth_token');
      localStorage.removeItem('oauth_refresh_token');
      setToken(null);
      setUser(null);
      setLoading(false);
      Sentry.setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    if (token || localStorage.getItem('oauth_refresh_token')) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  useEffect(() => {
    const handleLogout = () => {
      setToken(null);
      setUser(null);
      Sentry.setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);

    const verifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(48)));
    const challengeBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = base64UrlEncode(new Uint8Array(challengeBuf));
    sessionStorage.setItem('oauth_code_verifier', verifier);

    const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
    const authorizeUrl = import.meta.env.VITE_OAUTH_AUTHORIZE_URL;
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    window.location.href = `${authorizeUrl}?${params.toString()}`;
  };

  const logout = () => {
    localStorage.removeItem('oauth_token');
    localStorage.removeItem('oauth_refresh_token');
    setToken(null);
    setUser(null);
    Sentry.setUser(null);
  };

  const setTokenFromCallback = async (accessToken: string): Promise<boolean> => {
    localStorage.setItem('oauth_token', accessToken);
    setToken(accessToken);
    setLoading(true);
    return fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!user, loading, login, logout, setTokenFromCallback }}
    >
      {children}
    </AuthContext.Provider>
  );
};
