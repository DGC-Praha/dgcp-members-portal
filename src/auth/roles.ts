import type { User } from './AuthContext';

// Tagovacka-side authorization. Distinct from members-api's `user.isAdmin`
// (club admin in members-api) — this check mirrors what tagovacka's
// ManualTransferController enforces server-side: system ROLE_ADMIN OR an
// active club-admin membership in tagovacka. Used only for UI gating.
export function canChangeTags(user: User | null): boolean {
  const t = user?.tagovacka;
  if (!t) return false;
  if (t.roles.includes('ROLE_ADMIN')) return true;
  return t.membership?.role === 'admin' && t.membership.active;
}
