/**
 * Static tenant configuration. The portal is a single deploy artifact served
 * from N domains; on boot it reads `window.location.hostname` and looks up
 * which tenant it is. New tenants are added by editing this file and the
 * deployment provider's custom domain list — no rebuild matrix.
 *
 * `oauthClientId` is a public identifier by OAuth design (PKCE-only, no
 * secret). Safe to ship in the bundle.
 */
export interface TenantConfig {
  /** Canonical tenant id, matches Club.iDiscGolfClubId on members-api. */
  iDiscGolfClubId: number;
  /** Display name for the AppBar/title/etc. */
  displayName: string;
  /** Path under public/ to the brand logo (white-on-dark for the AppBar). */
  logoUrl: string;
  /** Per-tenant OAuth app's client_id, registered on tagovacka. */
  oauthClientId: string;
}

// Backend infrastructure shared across every tenant. Tagovacka is the single
// auth provider for all clubs; dgcp-members-api is one deployment that scopes
// requests by JWT claim. None of this should be duplicated into TENANTS.
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const TAGOVACKA_API_URL = isLocalhost
  ? 'http://disc-golf-tags.local'
  : 'https://api-discgolf-tags.dominikvoda.com';

export const TAGOVACKA_AUTHORIZE_URL = isLocalhost
  ? 'http://localhost:5173/oauth/authorize'
  : 'https://tagovacka.cz/oauth/authorize';

export const TAGOVACKA_PORTAL_URL = isLocalhost
  ? 'http://localhost:5173'
  : 'https://tagovacka.cz';

export const MEMBERS_API_URL = isLocalhost
  ? 'http://localhost:8090'
  : 'https://api-members-dgcp.dominikvoda.com';

export const TENANTS: Record<string, TenantConfig> = {
  'members.dgcp.cz': {
    iDiscGolfClubId: 15,
    displayName: 'DGCP',
    logoUrl: '/dgcp-logo-white.png',
    oauthClientId: 'dgt_b4a0540ab0f098866a241af5651a2aab',
  },
  'hornicikladno.dominikvoda.com': {
    iDiscGolfClubId: 3,
    displayName: 'Hornici Kladno',
    logoUrl: '/kladno-logo.png',
    oauthClientId: 'dgt_c463d3af3513ecbb5d5fe2e1eab72280',
  },
  // Local development: reuse the prod DGCP OAuth app (its redirect_uri
  // allowlist already includes http://localhost:5174/oauth/callback).
  localhost: {
    iDiscGolfClubId: 15,
    displayName: 'DGCP (dev)',
    logoUrl: '/dgcp-logo-white.png',
    oauthClientId: 'dgt_b4a0540ab0f098866a241af5651a2aab',
  },
};

/**
 * Resolves the tenant for the current browser hostname. Throws if the
 * hostname has no entry — surfaces config drift loudly instead of silently
 * defaulting to DGCP.
 */
export function resolveTenant(): TenantConfig {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const tenant = TENANTS[host];
  if (tenant === undefined) {
    throw new Error(
      `No tenant config for hostname "${host}". Known: ${Object.keys(TENANTS).join(', ')}`,
    );
  }
  return tenant;
}
