// Per-sport scoring palettes for the unified (non-cricket) scorer.
// Cricket has its own ball-by-ball screen.

export interface ScoreAction {
  code: string
  label: string
  scope: 'team' | 'player'
  points: number        // added to the team score
  statKey?: string      // match_players.stats key to increment (player actions)
  statVal?: number      // amount to add to that stat (default: points || 1)
}

export interface SportConfig {
  scoreLabel: string
  teamActions: ScoreAction[]    // rendered once per side (e.g. "Point A" / "Point B")
  playerActions: ScoreAction[]  // require a selected player
}

const racket: SportConfig = {
  scoreLabel: 'Points',
  teamActions: [{ code: 'pt', label: 'Point', scope: 'team', points: 1 }],
  playerActions: [],
}

export const SPORT_SCORING: Record<string, SportConfig> = {
  football: {
    scoreLabel: 'Goals',
    teamActions: [{ code: 'og', label: 'Own Goal', scope: 'team', points: 1 }],
    playerActions: [
      { code: 'goal', label: 'Goal', scope: 'player', points: 1, statKey: 'goals' },
      { code: 'assist', label: 'Assist', scope: 'player', points: 0, statKey: 'assists' },
      { code: 'yellow', label: 'Yellow', scope: 'player', points: 0, statKey: 'yellow' },
      { code: 'red', label: 'Red', scope: 'player', points: 0, statKey: 'red' },
    ],
  },
  basketball: {
    scoreLabel: 'Points',
    teamActions: [],
    playerActions: [
      { code: 'p1', label: '+1', scope: 'player', points: 1, statKey: 'points', statVal: 1 },
      { code: 'p2', label: '+2', scope: 'player', points: 2, statKey: 'points', statVal: 2 },
      { code: 'p3', label: '+3', scope: 'player', points: 3, statKey: 'points', statVal: 3 },
      { code: 'reb', label: 'Reb', scope: 'player', points: 0, statKey: 'rebounds' },
      { code: 'ast', label: 'Ast', scope: 'player', points: 0, statKey: 'assists' },
      { code: 'foul', label: 'Foul', scope: 'player', points: 0, statKey: 'fouls' },
    ],
  },
  kabaddi: {
    scoreLabel: 'Points',
    teamActions: [{ code: 'allout', label: 'All Out +2', scope: 'team', points: 2 }],
    playerActions: [
      { code: 'raid1', label: 'Raid +1', scope: 'player', points: 1, statKey: 'raid_points', statVal: 1 },
      { code: 'raid2', label: 'Raid +2', scope: 'player', points: 2, statKey: 'raid_points', statVal: 2 },
      { code: 'raid3', label: 'Raid +3', scope: 'player', points: 3, statKey: 'raid_points', statVal: 3 },
      { code: 'tackle', label: 'Tackle +1', scope: 'player', points: 1, statKey: 'tackle_points', statVal: 1 },
    ],
  },
  volleyball: {
    scoreLabel: 'Points',
    teamActions: [{ code: 'pt', label: 'Point', scope: 'team', points: 1 }],
    playerActions: [
      { code: 'ace', label: 'Ace +1', scope: 'player', points: 1, statKey: 'aces', statVal: 1 },
      { code: 'block', label: 'Block +1', scope: 'player', points: 1, statKey: 'blocks', statVal: 1 },
    ],
  },
  esports: {
    scoreLabel: 'Rounds',
    teamActions: [{ code: 'round', label: 'Round +1', scope: 'team', points: 1 }],
    playerActions: [
      { code: 'kill', label: 'Kill', scope: 'player', points: 0, statKey: 'kills' },
      { code: 'mvp', label: 'MVP', scope: 'player', points: 0, statKey: 'mvp' },
    ],
  },
  badminton: racket,
  tennis: racket,
  table_tennis: racket,
  pickleball: racket,
}

export function sportConfig(category: string): SportConfig {
  return SPORT_SCORING[category] ?? {
    scoreLabel: 'Score',
    teamActions: [{ code: 'pt', label: '+1', scope: 'team', points: 1 }],
    playerActions: [{ code: 'pt', label: '+1', scope: 'player', points: 1, statKey: 'points', statVal: 1 }],
  }
}
