// Derive team scores and per-player aggregates from the score_events log.

export function teamScores(events: any[]): { a: number; b: number } {
  let a = 0, b = 0
  for (const e of events) {
    if (e.team_side === 'a') a += e.points
    else if (e.team_side === 'b') b += e.points
  }
  return { a, b }
}

const STAT_LABELS: Record<string, string> = {
  goals: 'G', assists: 'A', yellow: 'YC', red: 'RC',
  points: 'pts', rebounds: 'reb', fouls: 'f',
  raid_points: 'raid', tackle_points: 'tackle', aces: 'ace', blocks: 'blk',
  kills: 'kills', mvp: 'MVP',
}

// Aggregate one player's events into { score, stats, detail }.
export function playerAgg(events: any[], matchPlayerId: string): { score: number; stats: Record<string, number>; detail: string } {
  let score = 0
  const stats: Record<string, number> = {}
  for (const e of events) {
    if (e.match_player_id !== matchPlayerId) continue
    score += e.points
    if (e.stat_key) stats[e.stat_key] = (stats[e.stat_key] ?? 0) + (e.stat_val || 0)
  }
  const detail = Object.entries(stats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${v} ${STAT_LABELS[k] ?? k}`)
    .join(', ')
  return { score, stats, detail }
}
