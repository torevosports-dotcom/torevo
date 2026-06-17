import { describeAction, nextStrike, deriveInnings } from './lib/cricket.ts'
import { teamScores, playerAgg } from './lib/scoring.ts'
import { computeCareer } from './lib/stats.ts'

let pass = 0, fail = 0
function eq(name: string, got: any, exp: any) {
  const ok = JSON.stringify(got) === JSON.stringify(exp)
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${name}` + (ok ? '' : `\n     got=${JSON.stringify(got)}\n     exp=${JSON.stringify(exp)}`))
  ok ? pass++ : fail++
}

// ---- Cricket: describeAction ----
eq('describeAction run 4', describeAction({ kind: 'run', runs: 4 }), { legal: true, runs_off_bat: 4, extra_type: null, extra_runs: 0, wicket: false })
eq('describeAction wide', describeAction({ kind: 'wide' }), { legal: false, runs_off_bat: 0, extra_type: 'wide', extra_runs: 1, wicket: false })
eq('describeAction wicket', describeAction({ kind: 'wicket' }), { legal: true, runs_off_bat: 0, extra_type: null, extra_runs: 0, wicket: true })

// ---- Cricket: strike rotation ----
eq('strike odd runs swaps', nextStrike('A', 'B', 1, false), ['B', 'A'])
eq('strike even runs stays', nextStrike('A', 'B', 2, false), ['A', 'B'])
eq('strike odd + over-end double-swaps', nextStrike('A', 'B', 1, true), ['A', 'B'])
eq('strike even + over-end swaps', nextStrike('A', 'B', 0, true), ['B', 'A'])

// ---- Cricket: deriveInnings ----
const balls = [
  { runs_off_bat: 4, extra_runs: 0, legal: true,  striker: 'A', non_striker: 'B', bowler: 'X', extra_type: null,   wicket: false, over_no: 0 },
  { runs_off_bat: 0, extra_runs: 1, legal: false, striker: 'A', non_striker: 'B', bowler: 'X', extra_type: 'wide', wicket: false, over_no: 0 },
  { runs_off_bat: 6, extra_runs: 0, legal: true,  striker: 'A', non_striker: 'B', bowler: 'X', extra_type: null,   wicket: false, over_no: 0 },
  { runs_off_bat: 0, extra_runs: 0, legal: true,  striker: 'A', non_striker: 'B', bowler: 'X', extra_type: null,   wicket: true, wicket_type: 'bowled', out_player: 'A', over_no: 0 },
]
const inn = deriveInnings(balls)
eq('innings total runs (4+1wd+6)', inn.runs, 11)
eq('innings wickets', inn.wickets, 1)
eq('innings legal balls', inn.legalBalls, 3)
eq('innings extras', inn.extras, 1)
const batA = inn.batters.find(b => b.name === 'A')!
eq('batter A runs', batA.runs, 10)
eq('batter A balls faced (no wide)', batA.balls, 3)
eq('batter A fours/sixes', [batA.fours, batA.sixes], [1, 1])
eq('batter A out', batA.out, true)
const bowlX = inn.bowlers.find(b => b.name === 'X')!
eq('bowler X wickets', bowlX.wickets, 1)
eq('bowler X runs conceded (incl wide)', bowlX.runs, 11)

// ---- Generic scoring: team + player ----
eq('teamScores', teamScores([
  { team_side: 'a', points: 1 }, { team_side: 'b', points: 2 }, { team_side: 'a', points: 1 },
]), { a: 2, b: 2 })
eq('playerAgg football', playerAgg([
  { match_player_id: 'p1', points: 1, stat_key: 'goals', stat_val: 1 },
  { match_player_id: 'p1', points: 0, stat_key: 'assists', stat_val: 1 },
  { match_player_id: 'p2', points: 1, stat_key: 'goals', stat_val: 1 },
], 'p1'), { score: 1, stats: { goals: 1, assists: 1 }, detail: '1 G, 1 A' })

// ---- Career stats: cricket batting ----
const career = computeCareer([
  { category: 'cricket', match_title: 'm1', stats: { runs: 50, balls: 25, fours: 5, out: true } },
  { category: 'cricket', match_title: 'm2', stats: { runs: 50, balls: 25, out: false } },
] as any)
const ck = career.find(c => c.category === 'cricket')!.cricket!
eq('career innings', ck.batting.innings, 2)
eq('career runs', ck.batting.runs, 100)
eq('career average (100/1 out)', ck.batting.average, '100.00')
eq('career fifties', ck.batting.fifties, 2)

console.log(`\n──────────\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
