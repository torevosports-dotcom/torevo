import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)
const sb = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })

let pass = 0, fail = 0
const ok = (n, c, extra = '') => { console.log(`${c ? '✅' : '❌'} ${n}${c ? '' : '  <<< ' + extra}`); c ? pass++ : fail++ }
const created = []

try {
  // 1. AUTH
  const { data: auth, error: aerr } = await sb.auth.signInAnonymously()
  ok('anonymous sign-in', !!auth?.user && !aerr, aerr?.message)
  const uid = auth.user.id

  // 2. PROFILE + fund wallet
  await sb.from('profiles').upsert({ id: uid, name: 'Tester', username: 'u' + uid.replace(/-/g, '').slice(0, 12), city: 'Test', wallet_balance: 5000 })
  let { data: prof } = await sb.from('profiles').select('wallet_balance').eq('id', uid).single()
  ok('profile created + funded ₹5000', prof?.wallet_balance == 5000, JSON.stringify(prof))

  // 3. CREATE individual event (escrow, ₹100)
  const { data: ev, error: eerr } = await sb.from('events').insert({
    title: 'TEST Individual', category: 'chess', format: 'individual', fee_mode: 'per_person',
    date: '2026-12-01', time: '10:00', venue_name: 'T', venue_address: 'T', city: 'Test', state: 'T',
    max_participants: 10, current_participants: 0, entry_fee: 100, prize_pool: 0,
    escrow_protected: true, skill_level: 'all', organizer_id: uid, organizer_name: 'Tester',
  }).select().single()
  ok('create individual event', !!ev && !eerr, eerr?.message)
  if (ev) created.push(ev.id)

  // 4. REGISTER (wallet) → ticket + wallet debit
  const { data: tid, error: rerr } = await sb.rpc('register_for_event', {
    p_event_id: ev.id, p_participant_name: 'Tester', p_team_name: null, p_payment_method: 'wallet',
    p_razorpay_payment_id: null, p_razorpay_order_id: null,
  })
  ok('register_for_event RPC returns ticket id', !!tid && !rerr, rerr?.message)
  ;({ data: prof } = await sb.from('profiles').select('wallet_balance').eq('id', uid).single())
  ok('wallet debited 5000→4900', prof?.wallet_balance == 4900, JSON.stringify(prof))

  // 5. ESCROW held
  let { data: esc } = await sb.from('escrow_holdings').select('*').eq('event_id', ev.id)
  ok('escrow holding created (held ₹100)', esc?.length === 1 && esc[0].status === 'held' && esc[0].amount == 100, JSON.stringify(esc))

  // 6. DUPLICATE registration blocked
  const dup = await sb.rpc('register_for_event', { p_event_id: ev.id, p_participant_name: 'Tester', p_team_name: null, p_payment_method: 'wallet', p_razorpay_payment_id: null, p_razorpay_order_id: null })
  ok('duplicate registration blocked', !!dup.error && /already registered/i.test(dup.error.message), dup.error?.message)

  // 7. CANCEL → refund wallet + escrow refunded
  const { error: cerr } = await sb.rpc('cancel_ticket', { p_ticket_id: tid })
  ok('cancel_ticket RPC ok', !cerr, cerr?.message)
  ;({ data: prof } = await sb.from('profiles').select('wallet_balance').eq('id', uid).single())
  ok('wallet refunded 4900→5000', prof?.wallet_balance == 5000, JSON.stringify(prof))
  ;({ data: esc } = await sb.from('escrow_holdings').select('status').eq('event_id', ev.id))
  ok('escrow marked refunded', esc?.[0]?.status === 'refunded', JSON.stringify(esc))

  // 8. SOLD OUT — capacity 1
  const { data: ev2 } = await sb.from('events').insert({
    title: 'TEST SoldOut', category: 'chess', format: 'individual', fee_mode: 'per_person',
    date: '2026-12-02', time: '10:00', venue_name: 'T', venue_address: 'T', city: 'Test', state: 'T',
    max_participants: 1, current_participants: 0, entry_fee: 0, prize_pool: 0,
    escrow_protected: false, skill_level: 'all', organizer_id: uid, organizer_name: 'Tester',
  }).select().single()
  created.push(ev2.id)
  await sb.rpc('register_for_event', { p_event_id: ev2.id, p_participant_name: 'Tester', p_team_name: null, p_payment_method: 'free', p_razorpay_payment_id: null, p_razorpay_order_id: null })
  const { data: ev2b } = await sb.from('events').select('current_participants,status').eq('id', ev2.id).single()
  ok('event fills to 1/1 and flips to sold_out', ev2b?.current_participants === 1 && ev2b?.status === 'sold_out', JSON.stringify(ev2b))

  // 9. CREATE team event (per-team fee)
  const { data: ev3 } = await sb.from('events').insert({
    title: 'TEST Team', category: 'cricket', format: 'team', fee_mode: 'per_team',
    date: '2026-12-03', time: '10:00', venue_name: 'T', venue_address: 'T', city: 'Test', state: 'T',
    max_participants: 22, current_participants: 0, team_size: 11, team_count: 2, team_size_min: 11, team_size_max: 11,
    entry_fee: 500, prize_pool: 10000, escrow_protected: true, skill_level: 'all', organizer_id: uid, organizer_name: 'Tester',
  }).select().single()
  created.push(ev3.id)
  ok('create team event (2 teams × 11, per-team ₹500)', ev3?.format === 'team' && ev3?.fee_mode === 'per_team' && ev3?.team_size === 11, JSON.stringify({ f: ev3?.format, fm: ev3?.fee_mode, ts: ev3?.team_size }))

  // 10. LIVE SCORING — generic event log
  const { data: lm } = await sb.from('live_matches').insert({ event_id: ev3.id, category: 'cricket', title: 'TEST live', emoji: '🏏', status: 'live', team_a: 'A', team_b: 'B', score_a: '0', score_b: '0', prize_pool: 0, viewers: 0, is_live: true }).select().single()
  ok('host can create live_match', !!lm)
  const { data: mp } = await sb.from('match_players').insert({ match_id: lm.id, team_side: 'a', player_name: 'Striker', score: 0, detail: '', stats: {}, is_active: true, sort_order: 1 }).select().single()
  ok('host can add match_player', !!mp)
  const { data: se } = await sb.from('score_events').insert({ match_id: lm.id, match_player_id: mp.id, team_side: 'a', action: 'p2', points: 2, stat_key: 'points', stat_val: 2 }).select().single()
  ok('host can record score_event', !!se)
  // 11. CRICKET ball
  const { data: cm } = await sb.from('cricket_matches').insert({ event_id: ev3.id, live_match_id: lm.id, overs_limit: 20, team_a: 'A', team_b: 'B', bat_first: 'a', innings: 1, striker: 'S', non_striker: 'N', bowler: 'X', status: 'live' }).select().single()
  ok('host can create cricket_match', !!cm)
  const { data: cb } = await sb.from('cricket_balls').insert({ cmatch_id: cm.id, innings: 1, over_no: 0, ball_in_over: 1, legal: true, striker: 'S', non_striker: 'N', bowler: 'X', runs_off_bat: 4, extra_type: null, extra_runs: 0, wicket: false }).select().single()
  ok('host can record cricket ball', !!cb)

  // 12. TEAM ROSTER (ticket_members) — register a team then add/edit members
  const { data: tid3 } = await sb.rpc('register_for_event', { p_event_id: ev3.id, p_participant_name: 'Captain', p_team_name: 'Test XI', p_payment_method: 'wallet', p_razorpay_payment_id: null, p_razorpay_order_id: null })
  ok('register team (captain) for team event', !!tid3)
  const { data: pl } = await sb.from('players').upsert({ phone: '+919998887777', name: 'Mate One' }, { onConflict: 'phone' }).select('id').single()
  const { error: tmErr } = await sb.from('ticket_members').insert([
    { ticket_id: tid3, name: 'Captain', phone: '+919990001111' },
    { ticket_id: tid3, name: 'Mate One', phone: '+919998887777', player_id: pl?.id },
  ])
  ok('captain can add team members (by phone)', !tmErr, tmErr?.message)
  let { data: tms } = await sb.from('ticket_members').select('*').eq('ticket_id', tid3)
  ok('roster has 2 members', tms?.length === 2, JSON.stringify(tms?.length))
  // edit roster: replace members
  await sb.from('ticket_members').delete().eq('ticket_id', tid3)
  await sb.from('ticket_members').insert({ ticket_id: tid3, name: 'Captain', phone: '+919990001111' })
  ;({ data: tms } = await sb.from('ticket_members').select('*').eq('ticket_id', tid3))
  ok('roster editable (now 1 member)', tms?.length === 1, JSON.stringify(tms?.length))
} catch (e) {
  ok('no unexpected exception', false, e.message)
} finally {
  // cleanup (cascades tickets/escrow/live_matches/score_events/cricket_*)
  for (const id of created) await sb.from('events').delete().eq('id', id)
  console.log(`\n🧹 cleaned up ${created.length} test events`)
  console.log(`──────────\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}
