// Twemoji CDN helper — renders consistent cross-platform emoji.
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

export function twemoji(emoji: string): string {
  const codePoint = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-');
  return `${TWEMOJI_BASE}/${codePoint}.svg`;
}

export const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  diamond: '#7c3aed',
  legend: '#dc2626',
};

export const TIER_BG: Record<string, string> = {
  bronze: '#f5e6d3',
  silver: '#f3f4f6',
  gold: '#fef9c3',
  diamond: '#f5f3ff',
  legend: '#fee2e2',
};

export const TIER_GLOW: Record<string, string> = {
  gold: '0 0 8px rgba(245, 158, 11, 0.4)',
  diamond: '0 0 10px rgba(124, 58, 237, 0.45)',
  legend: '0 0 12px rgba(220, 38, 38, 0.5)',
};

import i18n from '../../i18n';

export function tierLabel(tier: string): string {
  const key = `achievements.tier.${tier}`;
  const translated = i18n.t(key);
  if (translated !== key) return translated;
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
