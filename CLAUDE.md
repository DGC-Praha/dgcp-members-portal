# DGCP Members Portal

Club management portal for Discgolf Club Prague. React/Vite SPA.
Czech-only. Authenticates via OAuth against `disc-golf-tags`
(tagovacka.cz) and consumes data from **two** backends.

**Personal side project** — work directly on `main`, no PR workflow.

## The three-repo system

- **this repo** (`members-dgcp`) — the SPA.
- **[disc-golf-tags]** (`~/PhpstormProjects/disc-golf-tags`, a.k.a.
  "tagovacka") — OAuth AS + source of truth for tournaments/players/
  tag exchanges.
- **[dgcp-members-api]** (`~/PhpstormProjects/dgcp-members-api`) —
  club-specific data (phone, club role, achievements).

[disc-golf-tags]: https://github.com/dominikvoda/disc-golf-tags
[dgcp-members-api]: https://github.com/dominikvoda/dgcp-members-api

**All three deploy together.** No backwards-compatibility shims across
repos — if a contract changes, update all three in lock-step and push.

## Deployment

Fully automated: push to `main` and GitHub Actions
(`.github/workflows/deploy.yml`) builds the SPA and publishes it to
GitHub Pages. The `public/CNAME` routes it to `members.dgcp.cz`.

No shell, no `deploy.sh`. Env values come from GitHub Actions secrets
(`VITE_OAUTH_CLIENT_ID`, `VITE_OAUTH_CLIENT_SECRET`,
`VITE_OAUTH_AUTHORIZE_URL`, `VITE_API_URL`);
`VITE_MEMBERS_API_URL` is hardcoded in the workflow to
`https://api-members-dgcp.dominikvoda.com`.

Coordinated deploys: the two backends (`disc-golf-tags`,
`dgcp-members-api`) are deployed via SSH to a Websupport shell account
— see each repo's own CLAUDE.md § Deployment. When a cross-repo
contract changes, **deploy the backends first**, then push here (CI
picks it up automatically).

Check the last workflow run:
```bash
gh run list --repo DGC-Praha/dgcp-members-portal --limit 3
```

## Tech Stack
- React 19, Vite 8, MUI, react-router 7, TypeScript 5.9, i18next (cs-only)
- **Two** HTTP clients in `src/api/client.ts` — `apiClient` → tagovacka,
  `membersApiClient` → dgcp-members-api. Both carry the same tagovacka-issued
  JWT. Refresh logic lives only on `apiClient`; when either backend 401s,
  the next tagovacka call triggers the shared refresh.

## Local Development

### First-time setup on a fresh device

1. Clone + start the two backends (see their CLAUDE.mds):
   - `disc-golf-tags` → http://localhost (frontend http://localhost:5173)
   - `dgcp-members-api` → http://localhost:8090
2. In disc-golf-tags, register an OAuth app for this SPA and grab its
   `client_id`. The app's `webhook_secret` must match the members-api's
   `TAGOVACKA_SERVICE_SECRET` / `TAGOVACKA_WEBHOOK_SECRET`.
3. Then here:
   ```bash
   npm install
   cp .env.example .env.local
   # Edit .env.local — VITE_OAUTH_CLIENT_ID must match step 2
   npm run dev
   ```

### Env (see `.env.example`)

| Var | Purpose | Default |
| --- | ------- | ------- |
| `VITE_API_URL` | tagovacka backend | `http://localhost:8080` |
| `VITE_MEMBERS_API_URL` | dgcp-members-api backend | `http://localhost:8090` |
| `VITE_OAUTH_CLIENT_ID` | OAuth app's `client_id` in tagovacka DB | — |
| `VITE_OAUTH_AUTHORIZE_URL` | tagovacka authorize page | `http://localhost:5173/oauth/authorize` |
| `VITE_FEATURES_ACHIEVEMENTS` | Feature flag for achievements UI | `false` |

### Run

```bash
npm run dev       # Vite dev server
npm run lint
npm run build     # tsc -b && vite build
npm run preview
```

No automated tests yet — verify changes in the browser.

## OAuth flow (client side)
- User hits `VITE_OAUTH_AUTHORIZE_URL` with PKCE → tagovacka redirects
  back with code.
- SPA exchanges code for access + refresh tokens via tagovacka
  `/oauth/token`. Stored in `localStorage` (`oauth_token`,
  `oauth_refresh_token`).
- Access token carries `oauth_app_client_id` claim → tagovacka scopes
  API data to this client's club.
- On boot, if `oauth_token` is missing/expired but a refresh token is
  present, the app refreshes silently instead of bouncing to login.
- On 401 from either backend → `apiClient` interceptor refreshes via
  `/api/token/refresh` and replays the original request.

## Data split across the two backends

| Concern | Backend |
| ------- | ------- |
| Login, token refresh | tagovacka |
| Tournaments (upcoming/my/all/filter options) | tagovacka |
| Registration watchdog | tagovacka |
| Member list (tournament-data view) | tagovacka |
| `/api/me` (basic user) | tagovacka |
| Club member admin (phone, role, active status) | members-api |
| Club `/api/me` (club-specific profile) | members-api |
| Achievements (player + recent feed) | members-api |
| Sync members | members-api |

When adding a new endpoint, decide which backend owns the data and put
the method on the correct client in `src/api/client.ts` — the two
clients are intentionally separate so it's obvious at the call site.
