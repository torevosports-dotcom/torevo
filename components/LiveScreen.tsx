import { ScrollView, View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Eye } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useEventStore } from '../stores/eventStore'
import { useUiStore } from '../stores/uiStore'
import { formatCurrency } from '../lib/utils'

export default function LiveScreen() {
  const router = useRouter()
  const mode = useUiStore((s) => s.mode)
  const { liveMatches, fetchLiveMatches, subscribeToLiveMatches } = useEventStore()

  useEffect(() => {
    fetchLiveMatches()
    const unsubscribe = subscribeToLiveMatches()
    return unsubscribe
  }, [])

  // Back is safe whether we arrived via the tab (no stack) or a push.
  const goBack = () => (router.canGoBack() ? router.back() : router.navigate((mode === 'host' ? '/manage' : '/') as any))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
        <Pressable
          onPress={goBack}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color="#09090B" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#09090B' }}>Live Now</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#09090B' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: 'white' }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: 'white' }}>{liveMatches.length} live</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {liveMatches.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📺</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#18181B' }}>No live matches right now</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A1A1AA', textAlign: 'center', marginTop: 4 }}>Check back when an event is in progress.</Text>
          </View>
        )}
        {liveMatches.map((match, i) => {
          const players = match.players ?? []
          const teamA = players.filter((p) => p.team_side === 'a')
          const teamB = players.filter((p) => p.team_side === 'b')
          return (
          <Animated.View key={match.id} entering={FadeInDown.delay(i * 80).springify()}>
            <Pressable
              onPress={() => router.push(`/match/${match.event_id}` as any)}
              style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#09090B' }}
            >
              {/* Decoration blob */}
              <View style={{ position: 'absolute', bottom: -30, right: -30, width: 200, height: 120, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)' }} />

              <View style={{ padding: 18 }}>
                {/* Top row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 22 }}>{match.emoji}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: 'white' }}>LIVE</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} color="rgba(255,255,255,0.4)" />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {match.viewers.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: 'white', marginBottom: 4, lineHeight: 20 }}>
                  {match.title}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                  {match.status}
                </Text>

                {/* Scoreboard */}
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: 14,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'white', textAlign: 'center' }} numberOfLines={1}>
                      {match.team_a}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: 'white', marginTop: 4 }}>
                      {match.score_a}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 14 }}>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>VS</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'white', textAlign: 'center' }} numberOfLines={1}>
                      {match.team_b}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                      {match.score_b}
                    </Text>
                  </View>
                </View>

                {/* Per-player stats */}
                {players.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    {[{ name: match.team_a, list: teamA }, { name: match.team_b, list: teamB }].map((side, si) => (
                      <View key={si} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10 }}>
                        <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {side.name}
                        </Text>
                        {side.list.length === 0 ? (
                          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>—</Text>
                        ) : side.list.map((p, pi) => (
                          <View key={pi} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                            {p.is_active && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#22C55E' }} />}
                            <View style={{ flex: 1 }}>
                              <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: 'white' }}>
                                {p.player_name}
                              </Text>
                              <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                                {p.detail}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}

                {/* Prize pool */}
                {match.prize_pool > 0 && (
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                    🏆 {formatCurrency(match.prize_pool)} Prize Pool
                  </Text>
                )}

                {/* Live updates */}
                <View style={{ gap: 8 }}>
                  {match.updates.slice(0, 3).map((upd, j) => (
                    <View key={j} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                      <View style={{ marginTop: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 16 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter_500Medium' }}>{upd.time} · </Text>
                          {upd.text}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          </Animated.View>
          )
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}
