import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Eye, Trophy } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { useEventStore } from '../../stores/eventStore'
import { formatCurrency } from '../../lib/utils'

// Read-only per-event scoreboard. Shows LIVE (with realtime) while the match is
// running, and a final read-only result once the host ends it. No scoring here.
export default function MatchView() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const fetchEventMatch = useEventStore((s) => s.fetchEventMatch)
  const subscribeToEventMatch = useEventStore((s) => s.subscribeToEventMatch)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ event: any; match: any; isLive: boolean } | null>(null)

  const load = useCallback(async () => {
    const res = await fetchEventMatch(id)
    setData(res)
    setLoading(false)
    return res
  }, [id])

  useEffect(() => {
    let unsub: (() => void) | undefined
    ;(async () => {
      const res = await load()
      // Only keep a realtime channel open while the match is actually live.
      if (res?.match?.id && res.isLive) {
        unsub = subscribeToEventMatch(res.match.id, () => { load() })
      }
    })()
    return () => { unsub?.() }
  }, [id])

  if (loading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#000" /></SafeAreaView>
  }

  const match = data?.match
  const isLive = !!data?.isLive
  const ended = !isLive

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
      <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={18} color="#09090B" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#09090B' }}>{data?.event?.title ?? 'Match'}</Text>
      </View>
      {isLive ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#09090B' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: 'white' }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: 'white' }}>LIVE</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F1F1' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#52525B' }}>ENDED</Text>
        </View>
      )}
    </View>
  )

  if (!match) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Trophy size={40} color="#D4D4D8" strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#18181B', marginTop: 12, textAlign: 'center' }}>No scoreboard yet</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A1A1AA', textAlign: 'center', marginTop: 4 }}>
            The host hasn't started live scoring for this event.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const players = match.players ?? []
  const teamA = players.filter((p: any) => p.team_side === 'a')
  const teamB = players.filter((p: any) => p.team_side === 'b')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {header}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {ended && (
          <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 12, backgroundColor: '#F4F4F5', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Trophy size={15} color="#52525B" />
            <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#52525B' }}>
              This event has ended. Showing the final result.
            </Text>
          </View>
        )}

        <Animated.View entering={FadeInDown.springify()}>
          <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#09090B' }}>
            <View style={{ position: 'absolute', bottom: -30, right: -30, width: 200, height: 120, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)' }} />
            <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 22 }}>{match.emoji ?? '🏆'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                    {isLive && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />}
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: 'white' }}>{isLive ? 'LIVE' : 'FULL TIME'}</Text>
                  </View>
                </View>
                {isLive && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} color="rgba(255,255,255,0.4)" />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{(match.viewers ?? 0).toLocaleString()}</Text>
                  </View>
                )}
              </View>

              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{match.status}</Text>

              {/* Scoreboard */}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'white', textAlign: 'center' }}>{match.team_a}</Text>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, color: 'white', marginTop: 4 }}>{match.score_a}</Text>
                </View>
                <View style={{ paddingHorizontal: 14 }}>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>VS</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'white', textAlign: 'center' }}>{match.team_b}</Text>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{match.score_b}</Text>
                </View>
              </View>

              {match.prize_pool > 0 && (
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 14 }}>🏆 {formatCurrency(match.prize_pool)} Prize Pool</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Per-player stats */}
        {players.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 }}>
            {[{ name: match.team_a, list: teamA }, { name: match.team_b, list: teamB }].map((side, si) => (
              <View key={si} style={{ flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#EEE' }}>
                <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#A1A1AA', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{side.name}</Text>
                {side.list.length === 0 ? (
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#C4C4C4' }}>—</Text>
                ) : side.list.map((p: any, pi: number) => (
                  <View key={pi} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {p.is_active && isLive && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#22C55E' }} />}
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#18181B' }}>{p.player_name}</Text>
                      <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#A1A1AA' }}>{p.detail || '—'}</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, color: '#18181B' }}>{p.score}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Commentary / updates */}
        {match.updates?.length > 0 && (
          <View style={{ marginHorizontal: 16, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#EEE' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#18181B', marginBottom: 12 }}>{isLive ? 'Live Updates' : 'Match Timeline'}</Text>
            <View style={{ gap: 10 }}>
              {match.updates.map((upd: any, j: number) => (
                <View key={j} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ marginTop: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: '#D4D4D8' }} />
                  <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: '#52525B', lineHeight: 17 }}>
                    <Text style={{ color: '#A1A1AA', fontFamily: 'Inter_500Medium' }}>{upd.time} · </Text>{upd.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
