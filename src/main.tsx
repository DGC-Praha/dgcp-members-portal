import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initSentry } from './sentry';
import { TENANTS } from './tenants.config';

const root = document.getElementById('root')!;

if (TENANTS[window.location.hostname] === undefined) {
  // Render a meaningful "not configured" screen instead of letting the
  // module-evaluation throw chain (api/client, Layout, usePageTitle) leave
  // the user with a blank page on a misconfigured deploy.
  root.innerHTML = `
    <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 36rem; margin: 4rem auto;">
      <h1 style="margin: 0 0 0.5rem;">Tenant not configured</h1>
      <p style="color: #555;">No tenant entry for hostname <code>${window.location.hostname}</code>.</p>
      <p style="color: #777; font-size: 0.9rem;">
        Configured hostnames: ${Object.keys(TENANTS).map((h) => `<code>${h}</code>`).join(', ')}.
      </p>
    </div>
  `;
} else {
  initSentry();
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
