import { useEffect } from 'react';

const BASE = 'DGCP Members';

export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : BASE;
  }, [title]);
}
