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
  /** Tagovacka authorize endpoint. */
  oauthAuthorizeUrl: string;
  /** Tagovacka API base URL. */
  apiUrl: string;
  /**
   * Tagovacka user-facing portal base URL — links from the SPA into the
   * provider's profile/password pages append a path to this. Distinct from
   * `apiUrl` so localhost dev (frontend on :5173, backend on :80) stays
   * correct.
   */
  tagovackaPortalUrl: string;
  /** dgcp-members-api base URL. */
  membersApiUrl: string;
}

const PROD_TAGOVACKA = {
  oauthAuthorizeUrl: 'https://tagovacka.cz/oauth/authorize',
  // API + OAuth token endpoints live on a dedicated subdomain that fronts
  // the Symfony backend with proper CORS. tagovacka.cz itself is the
  // static frontend and 405s API methods.
  apiUrl: 'https://api-discgolf-tags.dominikvoda.com',
  tagovackaPortalUrl: 'https://tagovacka.cz',
  membersApiUrl: 'https://api-members-dgcp.dominikvoda.com',
};

export const TENANTS: Record<string, TenantConfig> = {
  'members.dgcp.cz': {
    iDiscGolfClubId: 15,
    displayName: 'DGCP',
    logoUrl: '/dgcp-logo-white.png',
    oauthClientId: 'dgt_b4a0540ab0f098866a241af5651a2aab',
    ...PROD_TAGOVACKA,
  },
  // Local development — uses the prod members.dgcp.cz OAuth app id; its
  // redirect allowlist already covers http://localhost:5174/oauth/callback.
  // The authorize URL points at tagovacka's frontend (port 5173), the API
  // base at tagovacka's backend (port 80 / disc-golf-tags.local host alias).
  localhost: {
    iDiscGolfClubId: 15,
    displayName: 'DGCP (dev)',
    logoUrl: '/dgcp-logo-white.png',
    oauthClientId: 'dgt_b4a0540ab0f098866a241af5651a2aab',
    oauthAuthorizeUrl: 'http://localhost:5173/oauth/authorize',
    apiUrl: 'http://disc-golf-tags.local',
    tagovackaPortalUrl: 'http://localhost:5173',
    membersApiUrl: 'http://localhost:8090',
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
