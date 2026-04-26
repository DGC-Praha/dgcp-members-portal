/**
 * Shared player-state shape for tournament rows on the wire.
 *
 * Tagovacka stamps default 'registered' on legacy payloads, so callers should
 * accept missing/string values defensively (hence `?: TournamentPlayerState`
 * on interfaces) and treat anything other than 'waiting' as in-the-running.
 */
export type TournamentPlayerState = 'registered' | 'waiting' | 'wildcard';

/**
 * Sort comparator that pushes waitlisted players to the end while keeping the
 * relative order of everyone else (Array.prototype.sort is stable in modern
 * runtimes). Used for both avatar previews and expanded member tables.
 */
export const sortByState = <T extends { state?: TournamentPlayerState | string }>(
  a: T,
  b: T,
): number => Number(a.state === 'waiting') - Number(b.state === 'waiting');
