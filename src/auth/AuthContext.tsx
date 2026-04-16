import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, membersApi } from '../api/client';

interface Membership {
  tagNumber: number | null;
  role: string;
  active: boolean;
  club: {
    name: string;
    slug: string;
    tagBadgeColor: string | null;
    tagBadgeHighlightColor: string | null;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  iDiscGolfId: number;
  pdgaNumber: number | null;
  iDiscGolfRating: number | null;
  pdgaRating: number | null;
  avatarUrl: string | null;
  cadgMembershipActive: boolean | null;
  pdgaMembershipActive: boolean | null;
  membership: Membership | null;
  // Club-specific (from dgcp-members-api):
  phone: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  setTokenFromCallback: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('oauth_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('oauth_token'));

  const fetchUser = useCallback(async () => {
    try {
      // Fetch profile from tagovacka AND club-specific data from members-api
      // in parallel. members-api is allowed to fail (e.g. during a rollout)
      // without blocking login — we just won't have phone/admin data.
      const [tagovackaRes, membersRes] = await Promise.all([
        api.getMe(),
        membersApi.getMe().catch(() => null),
      ]);
      const d = tagovackaRes.data;
      const m = d.memberships?.[0] ?? null;
      const club = membersRes?.data ?? null;
      setUser({
        id: d.id,
        name: d.name,
        email: d.email,
        iDiscGolfId: d.iDiscGolfId,
        pdgaNumber: d.pdgaNumber,
        iDiscGolfRating: d.iDiscGolfRating ?? null,
        pdgaRating: d.pdgaRating ?? null,
        avatarUrl: d.avatarUrl ?? null,
        cadgMembershipActive: d.cadgMembershipActive ?? null,
        pdgaMembershipActive: d.pdgaMembershipActive ?? null,
        membership: m ? {
          tagNumber: m.tagNumber,
          role: m.role,
          active: m.active ?? true,
          club: {
            name: m.club.name,
            slug: m.club.slug,
            tagBadgeColor: m.club.tagBadgeColor,
            tagBadgeHighlightColor: m.club.tagBadgeHighlightColor,
          },
        } : null,
        phone: club?.phone ?? null,
        isAdmin: club?.isAdmin ?? false,
      });
    } catch {
      localStorage.removeItem('oauth_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  useEffect(() => {
    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
    const authorizeUrl = import.meta.env.VITE_OAUTH_AUTHORIZE_URL;
    const redirectUri = `${window.location.origin}/oauth/callback`;
    window.location.href = `${authorizeUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  };

  const logout = () => {
    localStorage.removeItem('oauth_token');
    localStorage.removeItem('oauth_refresh_token');
    setToken(null);
    setUser(null);
  };

  const setTokenFromCallback = async (accessToken: string) => {
    localStorage.setItem('oauth_token', accessToken);
    setToken(accessToken);
    setLoading(true);
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!user, loading, login, logout, setTokenFromCallback }}>
      {children}
    </AuthContext.Provider>
  );
};
