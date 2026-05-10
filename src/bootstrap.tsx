import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initSentry } from './sentry';

export function bootstrap(root: HTMLElement): void {
  initSentry();
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
