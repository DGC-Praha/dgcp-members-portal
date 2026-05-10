import { TENANTS } from './tenants.config';

const root = document.getElementById('root')!;

// Tenant must be resolvable BEFORE any module that calls resolveTenant() at
// import time (api/client, Layout, usePageTitle). Resolving here lets us
// render a meaningful "not configured" screen instead of a blank page.
if (TENANTS[window.location.hostname] === undefined) {
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
  // Async-import the rest only after the host is known-good — avoids the
  // module-evaluation throw chain on misconfigured deploys.
  import('./bootstrap').then(({ bootstrap }) => bootstrap(root));
}
