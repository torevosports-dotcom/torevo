import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Send, UserPlus, RotateCcw } from 'lucide-react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useEventStore } from '../../stores/eventStore'
import { toast } from '../../stores/toastStore'
import { THEME } from '../../lib/utils'
import { sportConfig, type ScoreAction } from '../../lib/scoring-config'
import { teamScores, playerAgg } from '../../lib/scoring'

export default function Scorer() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getOrCreateMatch, saveMatch, listMatchPlayers, addMatchPlayer, postCommentary, fetchEventRoster } = useEventStore()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [match, setMatch] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [roster, setRoster] = useState<{ teamName: string; members: { name: string; phone: string }[] }[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const [teamA, setTeamA] = useState(''), [teamB, setTeamB] = useState(''), [status, setStatus] = useState('')
  const [pName, setPName] = useState(''), [pPhone, setPPhone] = useState(''), [pSide, setPSide] = useState<'a' | 'b'>('a')
  const [comment, setComment] = useState('')

  const cfg = sportConfig(event?.category ?? 'other')

  async function loadEvents(matchId: string) {
    const { data } = await supabase.from('score_events').select('*').eq('match_id', matchId).order('seq')
    setEvents(data ?? [])
  }

  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
      if (!ev) { setLoading(false); return }
      setEvent(ev)
      const m = await getOrCreateMatch({ id: ev.id, category: ev.category, title: ev.title, prize_pool: ev.prize_pool })
      // Mark the event live so it surfaces in the Live ticker for participants.
      if (ev.status !== 'live') await supabase.from('events').update({ status: 'live' }).eq('id', ev.id)
      setMatch(m); setTeamA(m.team_a); setTeamB(m.team_b); setStatus(m.status)
      setPlayers(await listMatchPlayers(m.id))
      setRoster(await fetchEventRoster(ev.id))
      await loadEvents(m.id)
      setLoading(false)
    })()
  }, [id])

  const scores = teamScores(events)

  async function pushScores(evs: any[]) {
    const s = teamScores(evs)
    await saveMatch(match.id, { score_a: String(s.a), score_b: String(s.b) })
  }

  async function record(action: ScoreAction, side: 'a' | 'b', player?: any) {
    if (action.scope === 'player' && !player) { toast('Tap a player first, then the action.'); return }
    const statVal = action.statVal ?? (action.points > 0 ? action.points : 1)
    const row = {
      match_id: match.id,
      match_player_id: action.scope === 'player' ? player.id : null,
      team_side: action.scope === 'player' ? player.team_side : side,
      action: action.code,
      points: action.points,
      stat_key: action.scope === 'player' ? (action.statKey ?? null) : null,
      stat_val: action.scope === 'player' ? statVal : 0,
    }
    const { data: inserted } = await supabase.from('score_events').insert(row).select().single()
    const evs = [...events, inserted]
    setEvents(evs)
    if (action.scope === 'player') {
      const agg = playerAgg(evs, player.id)
      await supabase.from('match_players').update({ score: agg.score, detail: agg.detail, stats: agg.stats }).eq('id', player.id)
      setPlayers(ps => ps.map(p => p.id === player.id ? { ...p, ...agg } : p))
    }
    await pushScores(evs)
  }

  async function undo() {
    if (!events.length) return
    const last = events[events.length - 1]
    await supabase.from('score_events').delete().eq('id', last.id)
    const evs = events.slice(0, -1)
    setEvents(evs)
    if (last.match_player_id) {
      const agg = playerAgg(evs, last.match_player_id)
      await supabase.from('match_players').update({ score: agg.score, detail: agg.detail, stats: agg.stats }).eq('id', last.match_player_id)
      setPlayers(ps => ps.map(p => p.id === last.match_player_id ? { ...p, ...agg } : p))
    }
    await pushScores(evs)
  }

  async function saveTeams() {
    await saveMatch(match.id, { team_a: teamA, team_b: teamB, status })
    toast('Match details updated.', 'success')
  }
  async function onAddPlayer() {
    if (!pName.trim()) return
    await addMatchPlayer(match.id, { name: pName.trim(), phone: pPhone.trim() || undefined, team_side: pSide })
    setPName(''); setPPhone('')
    setPlayers(await listMatchPlayers(match.id))
  }
  async function onPostComment() {
    if (!comment.trim()) return
    const n = new Date()
    await postCommentary(match.id, `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`, comment.trim())
    setComment(''); toast('Commentary sent live.', 'success')
  }

  const input = { backgroundColor: '#F4F4F4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontFamily: 'Inter_500Medium', fontSize: 13, color: THEME.text } as any
  const title = { fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.text, marginBottom: 10 } as any

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={THEME.text} /></SafeAreaView>
  if (!match) return <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'Inter_600SemiBold', color: THEME.textSecondary }}>Event not found.</Text></SafeAreaView>

  const teamPlayers = (s: 'a' | 'b') => players.filter(p => p.team_side === s)
  const actBtn = (a: ScoreAction, onPress: () => void, key: string, dark = false) => (
    <Pressable key={key} onPress={onPress} style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: 11, backgroundColor: dark ? '#000' : '#F0F0F0', marginRight: 8, marginBottom: 8 }}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: dark ? '#fff' : THEME.text }}>{a.label}</Text>
    </Pressable>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={THEME.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: THEME.text }}>Scorer</Text>
          <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>{match.title}</Text>
        </View>
        <Pressable onPress={undo} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 11, borderRadius: 17, backgroundColor: '#F0F0F0' }}>
          <RotateCcw size={13} color={THEME.text} /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: THEME.text }}>Undo</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Score */}
        <View style={{ backgroundColor: '#000', borderRadius: 16, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{teamA}</Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 34, color: '#fff' }}>{scores.a}</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>{cfg.scoreLabel}</Text>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{teamB}</Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 34, color: '#fff' }}>{scores.b}</Text>
          </View>
        </View>

        {/* Team-level actions */}
        {cfg.teamActions.length > 0 && (
          <View style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: THEME.border, marginBottom: 14 }}>
            <Text style={title}>Team Actions</Text>
            {cfg.teamActions.map(a => (
              <View key={a.code} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ width: 92, fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.textSecondary }}>{a.label}</Text>
                {actBtn({ ...a, label: teamA || 'Team A' }, () => record(a, 'a'), a.code + 'a', true)}
                {actBtn({ ...a, label: teamB || 'Team B' }, () => record(a, 'b'), a.code + 'b', true)}
              </View>
            ))}
          </View>
        )}

        {/* Players + per-player actions */}
        {(['a', 'b'] as const).map(side => (
          <View key={side} style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: THEME.border, marginBottom: 14 }}>
            <Text style={title}>{(side === 'a' ? teamA : teamB) || `Team ${side.toUpperCase()}`} — Players</Text>
            {teamPlayers(side).length === 0 && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: THEME.textTertiary, marginBottom: 8 }}>No players yet.</Text>}
            {teamPlayers(side).map(row => {
              const on = selected === row.id
              return (
                <Pressable key={row.id} onPress={() => setSelected(on ? null : row.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10, marginBottom: 6, backgroundColor: on ? '#000' : '#F7F7F7' }}>
                  <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, color: on ? '#fff' : THEME.text }}>{row.player_name}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: on ? 'rgba(255,255,255,0.7)' : THEME.textTertiary }}>{row.detail || '—'}</Text>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: on ? '#fff' : THEME.text }}>{row.score}</Text>
                </Pressable>
              )
            })}
            {/* per-player action buttons (apply to selected player on this team) */}
            {cfg.playerActions.length > 0 && (() => {
              const sel = players.find(p => p.id === selected && p.team_side === side)
              if (!sel) return <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary, marginTop: 2 }}>Tap a player above to credit an action.</Text>
              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                  {cfg.playerActions.map(a => actBtn(a, () => record(a, side, sel), a.code, a.points > 0))}
                </View>
              )
            })()}
          </View>
        ))}

        {/* Add player */}
        <View style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: THEME.border, marginBottom: 14 }}>
          <Text style={title}>Add Player</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {(['a', 'b'] as const).map(s => (
              <Pressable key={s} onPress={() => setPSide(s)} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: pSide === s ? '#000' : '#F0F0F0' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: pSide === s ? '#fff' : THEME.text }}>{(s === 'a' ? teamA : teamB) || `Team ${s.toUpperCase()}`}</Text>
              </Pressable>
            ))}
          </View>
          {roster.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: THEME.textSecondary, marginBottom: 6 }}>
                Tap a registered player → adds to Team {pSide.toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {roster.flatMap(t => t.members).filter(m => !players.some(p => p.player_name === m.name)).map((m, i) => (
                  <Pressable key={i}
                    onPress={async () => { await addMatchPlayer(match.id, { name: m.name, phone: m.phone || undefined, team_side: pSide }); setPlayers(await listMatchPlayers(match.id)) }}
                    style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: '#EFEFEF' }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.text }}>+ {m.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: THEME.textTertiary, marginTop: 8 }}>…or add someone not registered:</Text>
            </View>
          )}
          <TextInput value={pName} onChangeText={setPName} placeholder="Player name" placeholderTextColor={THEME.textTertiary} style={input} />
          <TextInput value={pPhone} onChangeText={setPPhone} placeholder="Mobile number (for their stats profile)" keyboardType="phone-pad" placeholderTextColor={THEME.textTertiary} style={[input, { marginTop: 8 }]} />
          <Pressable onPress={onAddPlayer} style={{ marginTop: 10, paddingVertical: 11, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <UserPlus size={15} color="#fff" /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>Add Player</Text>
          </Pressable>
        </View>

        {/* Teams + status */}
        <View style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: THEME.border, marginBottom: 14 }}>
          <Text style={title}>Match Details</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={teamA} onChangeText={setTeamA} placeholder="Team A" placeholderTextColor={THEME.textTertiary} style={[input, { flex: 1 }]} />
            <TextInput value={teamB} onChangeText={setTeamB} placeholder="Team B" placeholderTextColor={THEME.textTertiary} style={[input, { flex: 1 }]} />
          </View>
          <TextInput value={status} onChangeText={setStatus} placeholder="Status (e.g. 2nd Half · 38')" placeholderTextColor={THEME.textTertiary} style={[input, { marginTop: 8 }]} />
          <Pressable onPress={saveTeams} style={{ marginTop: 10, paddingVertical: 11, borderRadius: 12, backgroundColor: '#000', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>Save Details</Text>
          </Pressable>
        </View>

        {/* Commentary */}
        <View style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: THEME.border }}>
          <Text style={title}>Post Commentary</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={comment} onChangeText={setComment} placeholder="e.g. GOAL! Top corner finish" placeholderTextColor={THEME.textTertiary} style={[input, { flex: 1 }]} />
            <Pressable onPress={onPostComment} style={{ width: 44, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
