import type { EventCategory } from './types'

export type EventFormat = 'team' | 'doubles' | 'individual'

// Sports that are team games by default.
const TEAM_SPORTS: EventCategory[] = ['cricket', 'football', 'basketball', 'kabaddi', 'volleyball', 'esports']

export function defaultFormat(c: EventCategory): EventFormat {
  return TEAM_SPORTS.includes(c) ? 'team' : 'individual'
}

// Typical squad size per sport (host can override — e.g. box cricket).
const TEAM_SIZE: Partial<Record<EventCategory, number>> = {
  cricket: 11, football: 11, basketball: 5, kabaddi: 7, volleyball: 6, esports: 4,
}

export function defaultTeamSize(c: EventCategory, fmt: EventFormat): number {
  if (fmt === 'doubles') return 2
  return TEAM_SIZE[c] ?? 5
}

export const isTeamFormat = (f: EventFormat) => f === 'team' || f === 'doubles'
