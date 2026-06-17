// Ball-by-ball cricket engine. The scorecard is DERIVED from the list of balls,
// so undo = delete the last ball and everything recomputes.

export type CricketAction =
  | { kind: 'run'; runs: number }
  | { kind: 'wide' }
  | { kind: 'noball' }
  | { kind: 'bye'; runs: number }
  | { kind: 'legbye'; runs: number }
  | { kind: 'wicket'; runs?: number }

export interface BallRow {
  legal: boolean
  runs_off_bat: number
  extra_type: 'wide' | 'noball' | 'bye' | 'legbye' | null
  extra_runs: number
  wicket: boolean
  // filled by the scorer: striker, non_striker, bowler, out_player, over_no, ball_in_over
}

// Turn a tapped action into the stored ball fields.
export function describeAction(a: CricketAction): BallRow {
  switch (a.kind) {
    case 'run':    return { legal: true,  runs_off_bat: a.runs, extra_type: null,     extra_runs: 0, wicket: false }
    case 'wide':   return { legal: false, runs_off_bat: 0,      extra_type: 'wide',   extra_runs: 1, wicket: false }
    case 'noball': return { legal: false, runs_off_bat: 0,      extra_type: 'noball', extra_runs: 1, wicket: false }
    case 'bye':    return { legal: true,  runs_off_bat: 0,      extra_type: 'bye',    extra_runs: a.runs, wicket: false }
    case 'legbye': return { legal: true,  runs_off_bat: 0,      extra_type: 'legbye', extra_runs: a.runs, wicket: false }
    case 'wicket': return { legal: true,  runs_off_bat: a.runs ?? 0, extra_type: null, extra_runs: 0, wicket: true }
  }
}

// Does the striker keep strike? Swap on odd off-bat (or bye/legbye) runs, and at end of over.
export function nextStrike(
  striker: string, nonStriker: string, runScored: number, overEnded: boolean,
): [string, string] {
  let s = striker, ns = nonStriker
  if (runScored % 2 === 1) { [s, ns] = [ns, s] }
  if (overEnded) { [s, ns] = [ns, s] }
  return [s, ns]
}

export const oversStr = (legalBalls: number) => `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`

export interface Batter { name: string; runs: number; balls: number; fours: number; sixes: number; out: boolean }
export interface Bowler { name: string; balls: number; runs: number; wickets: number }
export interface Innings {
  runs: number; wickets: number; legalBalls: number; overs: string; extras: number; crr: string
  batters: Batter[]; bowlers: Bowler[]; thisOver: string[]
}

const r2 = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '0.00')

// One ball's short label for the "this over" strip.
function ballLabel(b: any): string {
  if (b.wicket) return 'W'
  if (b.extra_type === 'wide') return 'Wd'
  if (b.extra_type === 'noball') return 'Nb'
  if (b.extra_type === 'bye') return `${b.extra_runs}b`
  if (b.extra_type === 'legbye') return `${b.extra_runs}lb`
  return `${b.runs_off_bat}`
}

// Compute the full scorecard for one innings from its balls (ordered by seq).
export function deriveInnings(balls: any[]): Innings {
  let runs = 0, wickets = 0, legalBalls = 0, extras = 0
  const bat = new Map<string, Batter>()
  const bowl = new Map<string, Bowler>()
  const getBat = (n: string) => { if (!bat.has(n)) bat.set(n, { name: n, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }); return bat.get(n)! }
  const getBowl = (n: string) => { if (!bowl.has(n)) bowl.set(n, { name: n, balls: 0, runs: 0, wickets: 0 }); return bowl.get(n)! }

  let lastOver = -1
  let thisOver: string[] = []

  for (const b of balls) {
    runs += b.runs_off_bat + b.extra_runs
    extras += b.extra_runs
    if (b.legal) legalBalls++

    // batter
    const s = getBat(b.striker)
    s.runs += b.runs_off_bat
    if (b.extra_type !== 'wide') s.balls += 1          // faced everything except a wide
    if (b.runs_off_bat === 4) s.fours += 1
    if (b.runs_off_bat === 6) s.sixes += 1
    if (b.wicket && b.out_player) getBat(b.out_player).out = true

    // bowler — byes/legbyes are not charged to the bowler
    const bw = getBowl(b.bowler)
    if (b.legal) bw.balls += 1
    bw.runs += b.runs_off_bat + ((b.extra_type === 'wide' || b.extra_type === 'noball') ? b.extra_runs : 0)
    if (b.wicket && b.wicket_type !== 'runout') bw.wickets += 1

    if (b.wicket) wickets += 1

    // "this over" strip (reset each new over index)
    if (b.over_no !== lastOver) { lastOver = b.over_no; thisOver = [] }
    thisOver.push(ballLabel(b))
  }

  return {
    runs, wickets, legalBalls, overs: oversStr(legalBalls), extras,
    crr: legalBalls > 0 ? r2(runs / (legalBalls / 6)) : '0.00',
    batters: [...bat.values()],
    bowlers: [...bowl.values()],
    thisOver,
  }
}
