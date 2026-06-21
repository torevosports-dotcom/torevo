import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native'
import { toast } from '../../../stores/toastStore'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, RotateCcw } from 'lucide-react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useEventStore } from '../../../stores/eventStore'
import { THEME } from '../../../lib/utils'
import { describeAction, nextStrike, deriveInnings, oversStr, type CricketAction } from '../../../lib/cricket'

export default function CricketScorer() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const getOrCreateMatch = useEventStore(s => s.getOrCreateMatch)
  const fetchEventRoster = useEventStore(s => s.fetchEventRoster)
  const endMatch = useEventStore(s => s.endMatch)

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [cm, setCm] = useState<any>(null)         // cricket_matches row
  const [balls, setBalls] = useState<any[]>([])   // ALL balls for this match
  const [rosterNames, setRosterNames] = useState<string[]>([])

  // setup inputs
  const [overs, setOvers] = useState('20')
  const [tA, setTA] = useState(''), [tB, setTB] = useState('')
  const [batFirst, setBatFirst] = useState<'a' | 'b'>('a')
  const [sStriker, setSStriker] = useState(''), [sNon, setSNon] = useState(''), [sBowler, setSBowler] = useState('')

  // inline prompts
  const [newBatsman, setNewBatsman] = useState('')
  const [newBowler, setNewBowler] = useState('')
  const [needBatsman, setNeedBatsman] = useState(false)
  const [needBowler, setNeedBowler] = useState(false)

  async function loadBalls(cmatchId: string) {
    const { data } = await supabase.from('cricket_balls').select('*').eq('cmatch_id', cmatchId).order('seq')
    setBalls(data ?? [])
  }

  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
      if (!ev) { setLoading(false); return }
      setEvent(ev)
      const r = await fetchEventRoster(ev.id)
      setRosterNames([...new Set(r.flatMap((t: any) => t.members.map((m: any) => m.name)))] as string[])
      let { data: m } = await supabase.from('cricket_matches').select('*').eq('event_id', ev.id).maybeSingle()
      if (!m) {
        const ins = await supabase.from('cricket_matches').insert({ event_id: ev.id, team_a: 'Team A', team_b: 'Team B' }).select().single()
        m = ins.data
      }
      setCm(m)
      setTA(m.team_a); setTB(m.team_b); setOvers(String(m.overs_limit))
      await loadBalls(m.id)
      setLoading(false)
    })()
  }, [id])

  const inningsBalls = balls.filter(b => b.innings === cm?.innings)
  const inn = deriveInnings(inningsBalls)
  const battingSide = cm ? (cm.innings === 1 ? cm.bat_first : (cm.bat_first === 'a' ? 'b' : 'a')) : 'a'
  const battingTeam = cm ? (battingSide === 'a' ? cm.team_a : cm.team_b) : ''

  async function patchCm(fields: any) {
    await supabase.from('cricket_matches').update(fields).eq('id', cm.id)
    setCm((c: any) => ({ ...c, ...fields }))
  }

  // Mirror running total to the public live_matches row so the Live screen shows it.
  async function mirror(nextInn: typeof inn, status: string, m = cm) {
    if (!m?.live_match_id) return
    const field = battingSide === 'a' ? { score_a: `${nextInn.runs}/${nextInn.wickets}` } : { score_b: `${nextInn.runs}/${nextInn.wickets}` }
    await supabase.from('live_matches').update({ ...field, status }).eq('id', m.live_match_id)
  }

  async function startMatch() {
    if (!sStriker.trim() || !sNon.trim() || !sBowler.trim()) { toast('Enter striker, non-striker and bowler.'); return }
    const live = await getOrCreateMatch({ id: event.id, category: 'cricket', title: event.title, prize_pool: event.prize_pool })
    const fields = {
      overs_limit: parseInt(overs) || 20, team_a: tA || 'Team A', team_b: tB || 'Team B',
      bat_first: batFirst, innings: 1, striker: sStriker.trim(), non_striker: sNon.trim(), bowler: sBowler.trim(),
      status: 'live', live_match_id: live?.id ?? null,
    }
    await patchCm(fields)
    await supabase.from('events').update({ status: 'live' }).eq('id', event.id)
    if (live?.id) await supabase.from('live_matches').update({ team_a: fields.team_a, team_b: fields.team_b, category: 'cricket', status: '0.0 ov', score_a: '0/0', score_b: 'Yet to bat', is_live: true }).eq('id', live.id)
  }

  async function record(action: CricketAction) {
    if (needBatsman || needBowler || cm.status !== 'live') return
    const bf = describeAction(action)
    const legalBefore = inn.legalBalls
    const overNo = Math.floor(legalBefore / 6)
    const ballInOver = bf.legal ? (legalBefore % 6) + 1 : (legalBefore % 6)
    const outPlayer = bf.wicket ? cm.striker : null

    const { data: inserted } = await supabase.from('cricket_balls').insert({
      cmatch_id: cm.id, innings: cm.innings, over_no: overNo, ball_in_over: ballInOver, legal: bf.legal,
      striker: cm.striker, non_striker: cm.non_striker, bowler: cm.bowler,
      runs_off_bat: bf.runs_off_bat, extra_type: bf.extra_type, extra_runs: bf.extra_runs,
      wicket: bf.wicket, wicket_type: bf.wicket ? 'out' : null, out_player: outPlayer,
    }).select().single()
    const newBalls = [...balls, inserted]
    setBalls(newBalls)

    const nextInn = deriveInnings(newBalls.filter(b => b.innings === cm.innings))
    const legalAfter = nextInn.legalBalls
    const overEnded = bf.legal && legalAfter % 6 === 0 && legalAfter > 0
    const inningsEnded = nextInn.wickets >= 10 || legalAfter >= (cm.overs_limit * 6)

    // strike rotation (runs scored that rotate strike: off-bat + bye/legbye)
    const runScored = bf.runs_off_bat + (bf.extra_type === 'bye' || bf.extra_type === 'legbye' ? bf.extra_runs : 0)
    let [st, ns] = nextStrike(cm.striker, cm.non_striker, runScored, overEnded && !bf.wicket)

    if (inningsEnded) {
      if (cm.innings === 1) {
        await patchCm({ status: 'innings_break', target: nextInn.runs + 1, striker: st, non_striker: ns })
        await mirror(nextInn, `Target ${nextInn.runs + 1}`)
      } else {
        const chased = nextInn.runs >= (cm.target ?? 1e9)
        const result = chased ? `${battingTeam} won` : `${battingTeam} lost by ${(cm.target! - 1) - nextInn.runs} runs`
        await patchCm({ status: 'done', result, striker: st, non_striker: ns })
        await mirror(nextInn, 'Completed')
        // Close live scoring and mark the event completed (single source of truth).
        await endMatch(event.id, cm.live_match_id, result)
      }
      return
    }

    if (bf.wicket) { setNeedBatsman(true) } // striker leaves; ask for replacement
    if (overEnded) { setNeedBowler(true) }
    await patchCm({ striker: bf.wicket ? '' : st, non_striker: ns })
    await mirror(nextInn, `${nextInn.overs} ov`)
  }

  async function undo() {
    if (!balls.length) return
    const last = balls[balls.length - 1]
    await supabase.from('cricket_balls').delete().eq('id', last.id)
    setBalls(balls.slice(0, -1))
    setNeedBatsman(false); setNeedBowler(false)
  }

  async function confirmBatsman() {
    if (!newBatsman.trim()) return
    await patchCm({ striker: newBatsman.trim() })
    setNewBatsman(''); setNeedBatsman(false)
  }
  async function confirmBowler() {
    if (!newBowler.trim()) return
    await patchCm({ bowler: newBowler.trim() })
    setNewBowler(''); setNeedBowler(false)
  }
  async function startSecondInnings() {
    if (!sStriker.trim() || !sNon.trim() || !sBowler.trim()) { toast('Enter new openers and bowler.'); return }
    await patchCm({ innings: 2, status: 'live', striker: sStriker.trim(), non_striker: sNon.trim(), bowler: sBowler.trim() })
    setSStriker(''); setSNon(''); setSBowler('')
  }

  const input = { backgroundColor: '#F4F4F4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontFamily: 'Inter_500Medium', fontSize: 13, color: THEME.text } as any
  const title = { fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.text, marginBottom: 10 } as any

  // Tappable chips of registered players → ensures cricket names are real registrants.
  const nameChips = (onPick: (n: string) => void) => rosterNames.length === 0 ? null : (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {rosterNames.map((n, i) => (
        <Pressable key={i} onPress={() => onPick(n)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 13, backgroundColor: '#EFEFEF' }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: THEME.text }}>{n}</Text>
        </Pressable>
      ))}
    </View>
  )
  const fillSetup = (n: string) => { if (!sStriker) setSStriker(n); else if (!sNon) setSNon(n); else if (!sBowler) setSBowler(n) }

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={THEME.text} /></SafeAreaView>
  if (!cm) return <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'Inter_600SemiBold', color: THEME.textSecondary }}>Match not found.</Text></SafeAreaView>

  const Header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
      <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={18} color={THEME.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: THEME.text }}>🏏 Cricket Scorer</Text>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>{event?.title}</Text>
      </View>
    </View>
  )

  // ── SETUP ──
  if (cm.status === 'setup') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
        {Header}
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: THEME.border }}>
            <Text style={title}>Match Setup</Text>
            <TextInput value={tA} onChangeText={setTA} placeholder="Team A name" placeholderTextColor={THEME.textTertiary} style={input} />
            <TextInput value={tB} onChangeText={setTB} placeholder="Team B name" placeholderTextColor={THEME.textTertiary} style={[input, { marginTop: 8 }]} />
            <TextInput value={overs} onChangeText={setOvers} placeholder="Overs" keyboardType="number-pad" placeholderTextColor={THEME.textTertiary} style={[input, { marginTop: 8 }]} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.textSecondary, marginTop: 12, marginBottom: 6 }}>Batting first</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['a', 'b'] as const).map(sd => (
                <Pressable key={sd} onPress={() => setBatFirst(sd)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: batFirst === sd ? '#000' : '#F0F0F0' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: batFirst === sd ? '#fff' : THEME.text }}>{(sd === 'a' ? tA : tB) || `Team ${sd.toUpperCase()}`}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.textSecondary, marginTop: 12, marginBottom: 6 }}>Opening players</Text>
            <TextInput value={sStriker} onChangeText={setSStriker} placeholder="Striker *" placeholderTextColor={THEME.textTertiary} style={input} />
            <TextInput value={sNon} onChangeText={setSNon} placeholder="Non-striker" placeholderTextColor={THEME.textTertiary} style={[input, { marginTop: 8 }]} />
            <TextInput value={sBowler} onChangeText={setSBowler} placeholder="Opening bowler" placeholderTextColor={THEME.textTertiary} style={[input, { marginTop: 8 }]} />
            {nameChips(fillSetup)}
            <Pressable onPress={startMatch} style={{ marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: '#000', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>Start Match</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── INNINGS BREAK ──
  if (cm.status === 'innings_break') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
        {Header}
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: THEME.border }}>
            <Text style={title}>Innings Break · Target {cm.target}</Text>
            <TextInput value={sStriker} onChangeText={setSStriker} placeholder="New striker *" placeholderTextColor={THEME.textTertiary} style={input} />
            <TextInput value={sNon} onChangeText={setSNon} placeholder="New non-striker" placeholderTextColor={THEME.textTertiary} style={[input, { marginTop: 8 }]} />
            <TextInput value={sBowler} onChangeText={setSBowler} placeholder="Opening bowler" placeholderTextColor={THEME.textTertiary} style={[input, { marginTop: 8 }]} />
            {nameChips(fillSetup)}
            <Pressable onPress={startSecondInnings} style={{ marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: '#000', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>Start 2nd Innings</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── DONE ──
  if (cm.status === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
        {Header}
        <View style={{ padding: 16 }}>
          <View style={{ backgroundColor: '#000', borderRadius: 16, padding: 20, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#fff' }}>🏆 {cm.result}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{battingTeam} {inn.runs}/{inn.wickets} ({inn.overs})</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // ── LIVE SCORING ──
  const striker = inn.batters.find(b => b.name === cm.striker)
  const nonStriker = inn.batters.find(b => b.name === cm.non_striker)
  const bowler = inn.bowlers.find(b => b.name === cm.bowler)
  const need = (cm.target ?? null) != null ? `Need ${(cm.target! - inn.runs)} off ${(cm.overs_limit * 6) - inn.legalBalls}` : null

  const runBtn = (label: string, action: CricketAction, dark = false) => (
    <Pressable key={label} onPress={() => record(action)} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: dark ? '#000' : '#F0F0F0' }}>
      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: dark ? '#fff' : THEME.text }}>{label}</Text>
    </Pressable>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      {Header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Big score */}
        <View style={{ backgroundColor: '#000', borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{battingTeam} · Innings {cm.innings}</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 38, color: '#fff', marginTop: 2 }}>{inn.runs}/{inn.wickets}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Overs {inn.overs} / {cm.overs_limit} · CRR {inn.crr}</Text>
            {need && <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>{need}</Text>}
          </View>
          {/* this over */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {inn.thisOver.map((b, i) => (
              <View key={i} style={{ minWidth: 26, height: 26, paddingHorizontal: 6, borderRadius: 13, backgroundColor: b === 'W' ? '#fff' : 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: b === 'W' ? '#000' : '#fff' }}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* batsmen + bowler */}
        <View style={{ backgroundColor: THEME.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: THEME.border, marginBottom: 14 }}>
          {[{ b: striker, on: true, name: cm.striker }, { b: nonStriker, on: false, name: cm.non_striker }].map((x, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: THEME.text }}>{x.name || '—'}{x.on ? ' *' : ''}</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: THEME.textSecondary }}>{x.b ? `${x.b.runs} (${x.b.balls})` : '0 (0)'}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: THEME.text }}>🎯 {cm.bowler || '—'}</Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: THEME.textSecondary }}>{bowler ? `${bowler.wickets}/${bowler.runs} (${oversStr(bowler.balls)})` : '0/0 (0.0)'}</Text>
          </View>
        </View>

        {/* inline prompts */}
        {needBatsman && (
          <View style={{ backgroundColor: '#FFF7E6', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#F0D9A8' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#8A6D1A', marginBottom: 8 }}>Wicket! Enter new batsman</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={newBatsman} onChangeText={setNewBatsman} placeholder="New batsman" placeholderTextColor={THEME.textTertiary} style={[input, { flex: 1 }]} />
              <Pressable onPress={confirmBatsman} style={{ paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>In</Text></Pressable>
            </View>
            {nameChips(setNewBatsman)}
          </View>
        )}
        {needBowler && (
          <View style={{ backgroundColor: '#EAF4FF', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#B8D8F5' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#1A5A8A', marginBottom: 8 }}>Over complete · new bowler</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={newBowler} onChangeText={setNewBowler} placeholder="New bowler" placeholderTextColor={THEME.textTertiary} style={[input, { flex: 1 }]} />
              <Pressable onPress={confirmBowler} style={{ paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>Set</Text></Pressable>
            </View>
            {nameChips(setNewBowler)}
          </View>
        )}

        {/* run pad */}
        <View style={{ gap: 8, opacity: (needBatsman || needBowler) ? 0.4 : 1 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 1, 2, 3].map(n => runBtn(String(n), { kind: 'run', runs: n }))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {runBtn('4', { kind: 'run', runs: 4 }, true)}
            {runBtn('6', { kind: 'run', runs: 6 }, true)}
            {runBtn('Wd', { kind: 'wide' })}
            {runBtn('Nb', { kind: 'noball' })}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {runBtn('Bye', { kind: 'bye', runs: 1 })}
            {runBtn('LB', { kind: 'legbye', runs: 1 })}
            <Pressable onPress={() => record({ kind: 'wicket' })} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#B91C1C' }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: '#fff' }}>OUT</Text>
            </Pressable>
            <Pressable onPress={undo} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <RotateCcw size={15} color={THEME.text} /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.text }}>Undo</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
