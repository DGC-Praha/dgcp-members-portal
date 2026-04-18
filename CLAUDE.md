# DGCP Members Portal

Club management portal for Discgolf Club Prague. React/Vite SPA. Authenticates via OAuth against `disc-golf-tags` (tagovacka.cz) and consumes its API.

**Personal side project** — work directly on `main`, no PR workflow.

## Tech Stack
- React 19, Vite 8, MUI, react-router 7, TypeScript 5.9, i18next
- No backend — pure frontend. All data via `disc-golf-tags` API.

## Local Development

### Start
```bash
npm install
npm run dev
```

### Open
- App: http://localhost:5174  (use `open http://localhost:5174`)
- Requires `disc-golf-tags` running (API at http://localhost:8080, OAuth authorize at http://localhost:5173/oauth/authorize)

### Env (see `.env.example`)
- `VITE_API_URL` — `disc-golf-tags` backend (default `http://localhost:8080`)
- `VITE_OAUTH_CLIENT_ID` — OAuth app's `client_id` registered in disc-golf-tags
- `VITE_OAUTH_AUTHORIZE_URL` — default `http://localhost:5173/oauth/authorize`

### Test / Lint / Build
```bash
npm run lint
npm run build     # tsc -b && vite build
npm run preview
```
No automated tests yet.

## OAuth Flow (client side)
- User hits `VITE_OAUTH_AUTHORIZE_URL` with PKCE → disc-golf-tags redirects back with code
- Frontend exchanges code for access + refresh tokens via disc-golf-tags `/oauth/token`
- Access token carries `oauth_app_client_id` claim → disc-golf-tags scopes API data to this client's club
- On 401 → refresh via `/api/token/refresh`; tokens stored in localStorage

## Related Repo
- `disc-golf-tags` (tagovacka.cz) — OAuth AS + API. See its CLAUDE.md for running locally.
