import { useEffect } from 'react';
import { resolveTenant } from '../tenants.config';

const BASE = `${resolveTenant().displayName} Members`;

export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : BASE;
  }, [title]);
}
