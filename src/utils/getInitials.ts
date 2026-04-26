/**
 * Two-letter avatar initials, ASCII-uppercased. Returns '?' when name is
 * empty/whitespace so callers don't need to special-case missing names.
 */
export function getInitials(name: string): string {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return initials || '?';
}
