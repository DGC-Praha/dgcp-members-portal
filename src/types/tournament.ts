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

/**
 * Lifecycle bucket for a tournament from a player's perspective:
 *   - live: play window is open (dateStart <= today <= dateEnd), not finalized
 *   - waiting: play window closed but operator hasn't marked results finalized
 *   - upcoming: play window hasn't started, not finalized
 *   - past: operator has finalized results
 *
 * Finalization is authoritative — once marked, the tournament is past
 * regardless of dates. "live" and "waiting" share a "Právě hraje" section
 * in the UI and are differentiated with a badge.
 */
export type TournamentBucket = 'live' | 'waiting' | 'upcoming' | 'past';

type BucketableTournament = {
  dateStart: string | null;
  dateEnd: string;
  resultsFinalizedAt: string | null;
};

/**
 * Day-granularity bucket classifier. Uses YYYY-MM-DD string comparisons
 * instead of Date arithmetic so DST and timezone offsets never misclassify
 * boundary cases.
 */
export const classifyTournament = (
  t: BucketableTournament,
  today: string = new Date().toISOString().slice(0, 10),
): TournamentBucket => {
  if (t.resultsFinalizedAt !== null) return 'past';
  const start = t.dateStart ?? t.dateEnd;
  if (today < start) return 'upcoming';
  if (today > t.dateEnd) return 'waiting';
  return 'live';
};
