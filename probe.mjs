import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const sb = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const { data: auth } = await sb.auth.signInAnonymously()
const uid = auth.user.id
await sb.from('profiles').upsert({ id: uid, name: 'P', username: 'u' + uid.replace(/-/g, '').slice(0, 12), city: 'T' })

async function tableExists(t) { const { error } = await sb.from(t).select('id').limit(1); return !error || !/does not exist|schema cache/i.test(error.message) ? (error ? `ERR: ${error.message}` : 'OK') : 'MISSING' }
for (const t of ['match_players', 'players', 'cricket_matches', 'cricket_balls', 'score_events', 'escrow_holdings']) {
  console.log(`table ${t}: ${await tableExists(t)}`)
}
// can_score function (008)
const cs = await sb.rpc('can_score', { p_event: uid })
console.log(`can_score() function: ${cs.error ? 'MISSING/ERR: ' + cs.error.message : 'OK (returned ' + cs.data + ')'}`)

// live_matches write — create a team event then try insert, print real error
const { data: ev } = await sb.from('events').insert({ title: 'PROBE', category: 'cricket', date: '2026-12-09', time: '10:00', venue_name: 'T', venue_address: 'T', city: 'T', state: 'T', max_participants: 2, current_participants: 0, entry_fee: 0, prize_pool: 0, escrow_protected: false, skill_level: 'all', organizer_id: uid, organizer_name: 'P' }).select().single()
const { error: lmErr } = await sb.from('live_matches').insert({ event_id: ev.id, category: 'cricket', title: 'P', emoji: '🏏', status: 'live', team_a: 'A', team_b: 'B', score_a: '0', score_b: '0', prize_pool: 0, viewers: 0, is_live: true })
console.log(`live_matches insert: ${lmErr ? 'BLOCKED: ' + lmErr.message : 'OK'}`)
await sb.from('events').delete().eq('id', ev.id)
process.exit(0)
