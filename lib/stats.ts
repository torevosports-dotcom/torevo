import type { EventCategory } from './types'

// A raw per-match stat line for one player (as stored in match_players.stats).
export interface StatLine {
  category: EventCategory
  match_title: string
  status?: string
  stats: Record<string, any>
}

export interface StatTile {
  label: string
  value: string
}

export interface CricketBatting {
  innings: number
  runs: number
  balls: number
  notOuts: number
  fours: number
  sixes: number
  highScore: string
  fifties: number
  hundreds: number
  average: string
  strikeRate: string
}

export interface CricketBowling {
  innings: number
  overs: string
  wickets: number
  runs: number
  economy: string
  best: string
}

export interface CareerSport {
  category: EventCategory
  matches: number
  cricket?: { batting: CricketBatting; bowling: CricketBowling; catches: number }
  tiles?: StatTile[]   // generic headline numbers for non-cricket sports
}

const num = (v: any) => (typeof v === 'number' ? v : Number(v) || 0)
const round = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '0')

// Convert a balls count into "overs.balls" cricket notation, summing decimals.
function ballsToOvers(balls: number): string {
  const o = Math.floor(balls / 6)
  const b = balls % 6
  return b ? `${o}.${b}` : `${o}`
}

function aggregateCricket(lines: StatLine[]): CareerSport['cricket'] {
  let runs = 0, balls = 0, innings = 0, outs = 0, fours = 0, sixes = 0, hs = 0, hsNotOut = false
  let fifties = 0, hundreds = 0
  let bOvers = 0, bWickets = 0, bRuns = 0, bInnings = 0, catches = 0
  let bestW = -1, bestR = Infinity

  for (const l of lines) {
    const s = l.stats || {}
    const r = num(s.runs), b = num(s.balls)
    const batted = b > 0 || r > 0 || s.out === true
    if (batted) {
      innings++
      runs += r; balls += b; fours += num(s.fours); sixes += num(s.sixes)
      if (s.out === false) outs += 0; else outs += 1
      if (r >= 100) hundreds++; else if (r >= 50) fifties++
      if (r > hs) { hs = r; hsNotOut = s.out === false }
    }
    const ov = num(s.overs)
    if (ov > 0) {
      bInnings++
      bOvers += ov
      bWickets += num(s.wickets)
      bRuns += num(s.runs_conceded)
      const w = num(s.wickets)
      if (w > bestW || (w === bestW && num(s.runs_conceded) < bestR)) {
        bestW = w; bestR = num(s.runs_conceded)
      }
    }
    catches += num(s.catches)
  }

  const notOuts = innings - outs
  const totalBalls = Math.round(bOvers * 6)
  return {
    batting: {
      innings, runs, balls, notOuts, fours, sixes,
      highScore: innings ? `${hs}${hsNotOut ? '*' : ''}` : '-',
      fifties, hundreds,
      average: outs > 0 ? round(runs / outs) : (innings ? `${runs}` : '-'),
      strikeRate: balls > 0 ? round((runs / balls) * 100, 1) : '-',
    },
    bowling: {
      innings: bInnings,
      overs: ballsToOvers(totalBalls),
      wickets: bWickets,
      runs: bRuns,
      economy: totalBalls > 0 ? round(bRuns / (totalBalls / 6), 2) : '-',
      best: bestW >= 0 ? `${bestW}/${bestR}` : '-',
    },
    catches,
  }
}

// Generic: sum every numeric key across the sport's lines into headline tiles.
const LABELS: Record<string, string> = {
  goals: 'Goals', assists: 'Assists', minutes: 'Minutes', yellow: 'Yellow', red: 'Red', saves: 'Saves', shots: 'Shots',
  raid_points: 'Raid Pts', tackle_points: 'Tackle Pts', super_raids: 'Super Raids',
  points: 'Points', rebounds: 'Rebounds', steals: 'Steals', blocks: 'Blocks', aces: 'Aces', digs: 'Digs',
  kills: 'Kills', deaths: 'Deaths', mvp: 'MVPs', sets_won: 'Sets Won', matches_won: 'Wins',
}
function aggregateGeneric(lines: StatLine[]): StatTile[] {
  const totals: Record<string, number> = {}
  for (const l of lines) {
    for (const [k, v] of Object.entries(l.stats || {})) {
      if (typeof v === 'number' || (!isNaN(Number(v)) && v !== '' && v !== null)) {
        totals[k] = (totals[k] ?? 0) + num(v)
      }
    }
  }
  return Object.entries(totals)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => ({ label: LABELS[k] ?? k.replace(/_/g, ' '), value: `${v}` }))
}

// Group raw stat lines by sport and compute a career summary per sport.
export function computeCareer(lines: StatLine[]): CareerSport[] {
  const bySport = new Map<EventCategory, StatLine[]>()
  for (const l of lines) {
    const arr = bySport.get(l.category) ?? []
    arr.push(l)
    bySport.set(l.category, arr)
  }

  const out: CareerSport[] = []
  for (const [category, ls] of bySport) {
    if (category === 'cricket') {
      out.push({ category, matches: ls.length, cricket: aggregateCricket(ls) })
    } else {
      out.push({ category, matches: ls.length, tiles: aggregateGeneric(ls) })
    }
  }
  // Most-played sport first.
  return out.sort((a, b) => b.matches - a.matches)
}
