import { View, Text, Pressable, FlatList, Image, Dimensions, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell, Search, ChevronRight } from 'lucide-react-native'
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useEventStore } from '../../stores/eventStore'
import { useAuthStore } from '../../stores/authStore'
import { categoryMeta, formatCurrency, THEME } from '../../lib/utils'
import type { EventCategory } from '../../lib/types'

const { width: W } = Dimensions.get('window')
const HERO_H = Math.min(Math.round(W * 1.18), 540)
const PADDLE = require('../../assets/sports/pickleball_icon.png')

const CHIPS: { key: EventCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'Trending', emoji: '🔥' },
  { key: 'cricket', label: 'Cricket', emoji: '🏏' },
  { key: 'football', label: 'Football', emoji: '⚽' },
  { key: 'basketball', label: 'Basketball', emoji: '🏀' },
  { key: 'badminton', label: 'Badminton', emoji: '🏸' },
  { key: 'kabaddi', label: 'Kabaddi', emoji: '🤼' },
  { key: 'esports', label: 'Esports', emoji: '🎮' },
  { key: 'volleyball', label: 'Volleyball', emoji: '🏐' },
  { key: 'pickleball', label: 'Pickleball', emoji: '🥒' },
]

const SPORTS_GRID = [
  { key: 'cricket', label: 'Cricket', image: require('../../assets/sports/cricket.png') },
  { key: 'football', label: 'Football', image: require('../../assets/sports/football.png') },
  { key: 'basketball', label: 'Basketball', image: require('../../assets/sports/basketball.png') },
  { key: 'badminton', label: 'Badminton', image: require('../../assets/sports/badminton.png') },
  { key: 'kabaddi', label: 'Kabaddi', image: require('../../assets/sports/kabaddi.png') },
  { key: 'esports', label: 'Esports', image: require('../../assets/sports/esports.png') },
  { key: 'volleyball', label: 'Volleyball', image: require('../../assets/sports/volleyball.png') },
  { key: 'chess', label: 'Chess', image: require('../../assets/sports/chess.png') },
  { key: 'table_tennis', label: 'Table Tennis', image: require('../../assets/sports/table_tennis.png') },
  { key: 'pickleball', label: 'Pickleball', image: require('../../assets/sports/pickleball.png') },
]

function LiveDot() {
  const sc = useSharedValue(1), op = useSharedValue(1)
  useEffect(() => {
    sc.value = withRepeat(withSequence(withTiming(2.4, { duration: 800 }), withTiming(1, { duration: 0 })), -1, false)
    op.value = withRepeat(withSequence(withTiming(0, { duration: 800 }), withTiming(1, { duration: 0 })), -1, false)
  }, [])
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: op.value }))
  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' }, pulse]} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' }} />
    </View>
  )
}

// Gradient approximated with stacked translucent layers (no native dep).
function Shade() {
  return (
    <>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: 'rgba(0,0,0,0.35)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%', backgroundColor: 'rgba(0,0,0,0.62)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '16%', backgroundColor: 'rgba(0,0,0,0.85)' }} />
    </>
  )
}

// ── Poster card (trending rail) ──
function Poster({ event, onPress, rank }: { event: any; onPress: () => void; rank?: number }) {
  const m = categoryMeta[event.category as EventCategory] ?? categoryMeta.other
  return (
    <Pressable onPress={onPress} style={{ width: 150, marginRight: 12 }}>
      <View style={{ width: 150, height: 210, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111' }}>
        <Image source={m.image} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
        <Shade />
        {rank != null && (
          <Text style={{ position: 'absolute', left: 6, top: -6, fontFamily: 'Inter_900Black', fontSize: 60, color: 'rgba(255,255,255,0.9)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 }}>{rank}</Text>
        )}
        {event.status === 'live' ? (
          <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#000', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 11 }}>
            <LiveDot /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: '#fff' }}>LIVE</Text>
          </View>
        ) : event.entry_fee === 0 ? (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 11 }}>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 8, color: '#000' }}>FREE</Text>
          </View>
        ) : null}
        <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
          <Text numberOfLines={2} style={{ fontFamily: 'Inter_700Bold', fontSize: 12.5, color: '#fff', lineHeight: 16 }}>{event.title}</Text>
          <Text numberOfLines={1} style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
            {m.label} · {event.location?.city ?? ''}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

// ── Section rail ──
function Rail({ title, data, render, onSeeAll }: { title: string; data: any[]; render: (item: any, i: number) => any; onSeeAll?: () => void }) {
  if (!data.length) return null
  return (
    <View style={{ marginTop: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: THEME.text, flex: 1, letterSpacing: -0.3 }}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.textTertiary }}>See all</Text>
            <ChevronRight size={14} color={THEME.textTertiary} />
          </Pressable>
        )}
      </View>
      <FlatList horizontal showsHorizontalScrollIndicator={false} data={data} keyExtractor={(it, i) => it.id ?? String(i)}
        contentContainerStyle={{ paddingHorizontal: 16 }} renderItem={({ item, index }) => render(item, index)} />
    </View>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { events, fetchEvents, setFilter, filters } = useEventStore()
  const liveMatches = useEventStore((s) => s.liveMatches)
  const fetchLiveMatches = useEventStore((s) => s.fetchLiveMatches)
  const subscribeToLiveMatches = useEventStore((s) => s.subscribeToLiveMatches)

  useEffect(() => {
    fetchEvents()
    fetchLiveMatches()
    const unsub = subscribeToLiveMatches()
    return unsub
  }, [])

  const activeCategory = filters.category ?? 'all'
  let pool = events.filter((e) => e.status !== 'completed' && e.status !== 'cancelled')
  if (activeCategory !== 'all') pool = pool.filter((e) => e.category === activeCategory)

  const heroItems = [...pool].sort((a, b) => (b.prize_pool - a.prize_pool) || (b.current_participants - a.current_participants)).slice(0, 6)
  const trending = [...pool].sort((a, b) => b.current_participants - a.current_participants).slice(0, 10)
  const freeEvents = pool.filter((e) => e.entry_fee === 0).slice(0, 10)
  const prizeEvents = [...pool].filter((e) => e.prize_pool > 0).sort((a, b) => b.prize_pool - a.prize_pool).slice(0, 10)
  const soon = [...pool].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 10)

  const heroRef = useRef<FlatList<any>>(null)
  const [heroPage, setHeroPage] = useState(0)
  useEffect(() => {
    if (heroItems.length < 2) return
    const t = setInterval(() => {
      setHeroPage((p) => {
        const n = (p + 1) % heroItems.length
        heroRef.current?.scrollToOffset({ offset: n * W, animated: true })
        return n
      })
    }, 4000)
    return () => clearInterval(t)
  }, [heroItems.length])

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) ?? 'U'
  const goEvent = (id: string) => router.push(`/events/${id}` as any)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8, backgroundColor: THEME.bg }}>
        <Image source={require('../../assets/logo_h.png')} style={{ width: 116, height: 32 }} resizeMode="contain" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => router.push('/search' as any)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.border }}>
            <Search size={18} color={THEME.text} strokeWidth={2} />
          </Pressable>
          <Pressable style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.border }}>
            <Bell size={18} color={THEME.text} strokeWidth={1.9} />
          </Pressable>
          <Pressable onPress={() => router.push('/profile' as any)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>{initials}</Text>
          </Pressable>
        </View>
      </View>

      {/* Category chips */}
      <View>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={CHIPS} keyExtractor={(i) => i.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
          renderItem={({ item }) => {
            const active = activeCategory === item.key
            return (
              <Pressable onPress={() => setFilter('category', item.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: active ? '#000' : '#FFFFFF', borderWidth: 1, borderColor: active ? '#000' : THEME.border }}>
                {item.key === 'pickleball'
                  ? <Image source={PADDLE} style={{ width: 16, height: 16 }} resizeMode="contain" />
                  : <Text style={{ fontSize: 14 }}>{item.emoji}</Text>}
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: active ? '#fff' : THEME.textSecondary }}>{item.label}</Text>
              </Pressable>
            )
          }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {/* ── IMMERSIVE HERO ── */}
        {heroItems.length > 0 && (
          <Animated.View entering={FadeIn} style={{ marginTop: 2 }}>
            <FlatList
              ref={heroRef}
              data={heroItems}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              windowSize={3}
              removeClippedSubviews
              keyExtractor={(e) => e.id}
              onMomentumScrollEnd={(e) => setHeroPage(Math.round(e.nativeEvent.contentOffset.x / W))}
              onScrollToIndexFailed={() => {}}
              renderItem={({ item }) => {
                const m = categoryMeta[item.category as EventCategory] ?? categoryMeta.other
                return (
                  <Pressable onPress={() => goEvent(item.id)} style={{ width: W, height: HERO_H }}>
                    <Image source={m.image} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '34%', backgroundColor: 'rgba(0,0,0,0.25)' }} />
                    <Shade />
                    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, backgroundColor: THEME.bg }} />
                    <View style={{ position: 'absolute', top: 14, left: 20 }}>
                      {item.status === 'live' ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#000', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20 }}>
                          <LiveDot /><Text style={{ fontFamily: 'Inter_900Black', fontSize: 10, color: '#fff', letterSpacing: 1 }}>LIVE</Text>
                        </View>
                      ) : item.prize_pool > 0 ? (
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 10, color: '#fff', letterSpacing: 1 }}>{`🏆 ${formatCurrency(item.prize_pool)}`}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={{ position: 'absolute', bottom: 70, left: 20, right: 20 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11.5, color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, marginBottom: 8 }}>
                        {m.label.toUpperCase()}  •  {item.location?.city}
                      </Text>
                      <Text numberOfLines={2} style={{ fontFamily: 'Inter_900Black', fontSize: 30, lineHeight: 33, color: '#fff', marginBottom: 14, letterSpacing: -0.5 }}>
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Pressable onPress={() => goEvent(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff', paddingHorizontal: 26, paddingVertical: 13, borderRadius: 8 }}>
                          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, color: '#000' }}>{item.entry_fee === 0 ? 'Register Free' : 'Register'}</Text>
                        </Pressable>
                        <Pressable onPress={() => goEvent(item.id)} style={{ paddingHorizontal: 20, paddingVertical: 13, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>Details</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                )
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: -2 }}>
              {heroItems.map((_, i) => (
                <View key={i} style={{ width: i === heroPage ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === heroPage ? '#000' : '#CFCFCF' }} />
              ))}
            </View>
          </Animated.View>
        )}

        {/* LIVE NOW */}
        {liveMatches.length > 0 && (
          <Rail title="🔴 Live Now" data={liveMatches} onSeeAll={() => router.push('/live' as any)}
            render={(item) => (
              <Pressable key={item.id} onPress={() => router.push('/live' as any)} style={{ width: 250, marginRight: 12, backgroundColor: '#000', borderRadius: 16, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Text style={{ fontSize: 15 }}>{item.emoji}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 11 }}>
                    <LiveDot /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: '#fff' }}>LIVE</Text>
                  </View>
                  <Text numberOfLines={1} style={{ flex: 1, textAlign: 'right', fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{item.status}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' }}>{item.team_a}</Text>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15, color: '#fff', marginLeft: 8 }}>{item.score_a}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item.team_b}</Text>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15, color: 'rgba(255,255,255,0.7)', marginLeft: 8 }}>{item.score_b}</Text>
                </View>
              </Pressable>
            )} />
        )}

        {/* TRENDING — numbered posters */}
        <Rail title="Trending Now" data={trending} onSeeAll={() => router.push('/discover' as any)}
          render={(item, i) => <Poster key={item.id} event={item} rank={i + 1} onPress={() => goEvent(item.id)} />} />

        {/* BROWSE BY SPORT */}
        <View style={{ marginTop: 26 }}>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: THEME.text, paddingHorizontal: 16, marginBottom: 12, letterSpacing: -0.3 }}>Browse by Sport</Text>
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={SPORTS_GRID} keyExtractor={(i) => i.key}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => { setFilter('category', item.key as EventCategory); router.push('/discover' as any) }} style={{ width: 92, marginRight: 12 }}>
                <View style={{ width: 92, height: 92, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111' }}>
                  <Image source={item.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.5)' }} />
                  <Text numberOfLines={1} style={{ position: 'absolute', left: 6, right: 6, bottom: 6, fontFamily: 'Inter_700Bold', fontSize: 10, color: '#fff' }}>{item.label}</Text>
                </View>
              </Pressable>
            )} />
        </View>

        {/* FREE ENTRY */}
        <Rail title="Free Entry" data={freeEvents} onSeeAll={() => router.push('/discover' as any)}
          render={(item) => <Poster key={item.id} event={item} onPress={() => goEvent(item.id)} />} />

        {/* BIG PRIZE POOLS */}
        <Rail title="Big Prize Pools" data={prizeEvents} onSeeAll={() => router.push('/discover' as any)}
          render={(item) => <Poster key={item.id} event={item} onPress={() => goEvent(item.id)} />} />

        {/* HAPPENING SOON */}
        <Rail title="Happening Soon" data={soon} onSeeAll={() => router.push('/discover' as any)}
          render={(item) => <Poster key={item.id} event={item} onPress={() => goEvent(item.id)} />} />

        {pool.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: THEME.text }}>No events yet</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.textTertiary, marginTop: 4 }}>Pull to refresh or check back soon.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
