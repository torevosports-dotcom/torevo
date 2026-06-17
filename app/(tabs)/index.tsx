import { View, Text, Pressable, FlatList, Platform, Image, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell, Search, SlidersHorizontal, ArrowUpRight } from 'lucide-react-native'
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useEventStore } from '../../stores/eventStore'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { categoryMeta, statusMeta, formatCurrency, THEME } from '../../lib/utils'
import type { EventCategory } from '../../lib/types'

const { width: W } = Dimensions.get('window')
const HERO_H = 310

const CHIPS: { key: EventCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all',        label: 'Trending',   emoji: '🔥' },
  { key: 'cricket',   label: 'Cricket',    emoji: '🏏' },
  { key: 'football',  label: 'Football',   emoji: '⚽' },
  { key: 'basketball',label: 'Basketball', emoji: '🏀' },
  { key: 'badminton', label: 'Badminton',  emoji: '🏸' },
  { key: 'kabaddi',   label: 'Kabaddi',    emoji: '🤼' },
  { key: 'esports',   label: 'Esports',    emoji: '🎮' },
  { key: 'volleyball',label: 'Volleyball', emoji: '🏐' },
  { key: 'pickleball',label: 'Pickleball', emoji: '🥒' },
]

const SPORTS_GRID = [
  { key: 'cricket',      label: 'Cricket',      image: require('../../assets/sports/cricket.png') },
  { key: 'football',     label: 'Football',     image: require('../../assets/sports/football.png') },
  { key: 'basketball',   label: 'Basketball',   image: require('../../assets/sports/basketball.png') },
  { key: 'badminton',    label: 'Badminton',    image: require('../../assets/sports/badminton.png') },
  { key: 'kabaddi',      label: 'Kabaddi',      image: require('../../assets/sports/kabaddi.png') },
  { key: 'esports',      label: 'Esports',      image: require('../../assets/sports/esports.png') },
  { key: 'volleyball',   label: 'Volleyball',   image: require('../../assets/sports/volleyball.png') },
  { key: 'chess',        label: 'Chess',        image: require('../../assets/sports/chess.png') },
  { key: 'table_tennis', label: 'Table Tennis', image: require('../../assets/sports/table_tennis.png') },
  { key: 'pickleball',   label: 'Pickleball',   image: require('../../assets/sports/pickleball.png') },
]

// ─── LiveDot ──────────────────────────────────────────────────────────────────
function LiveDot() {
  const sc = useSharedValue(1)
  const op = useSharedValue(1)

  useEffect(() => {
    sc.value = withRepeat(
      withSequence(withTiming(2.4, { duration: 800 }), withTiming(1, { duration: 0 })),
      -1, false
    )
    op.value = withRepeat(
      withSequence(withTiming(0, { duration: 800 }), withTiming(1, { duration: 0 })),
      -1, false
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }],
    opacity: op.value,
  }))

  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{
        position: 'absolute', width: 8, height: 8, borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
      }, pulseStyle]} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' }} />
    </View>
  )
}

// ─── SpotsRing ────────────────────────────────────────────────────────────────
function SpotsRing({ spots, maxSpots, size = 52 }: { spots: number; maxSpots: number; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: 3, borderColor: '#E0E0E0',
      }} />
      <View style={{
        position: 'absolute', width: size - 8, height: size - 8, borderRadius: (size - 8) / 2,
        borderWidth: 3, borderColor: 'transparent',
        borderTopColor: spots <= 5 ? '#000000' : '#4A4A4A',
        transform: [{ rotate: '-45deg' }],
      }} />
      <Text style={{ fontFamily: 'Inter_900Black', fontSize: size > 48 ? 13 : 11, color: '#000000', textAlign: 'center' }}>
        {spots}
      </Text>
      <Text style={{ fontFamily: 'Inter_300Light', fontSize: 7, color: '#9A9A9A', textAlign: 'center', letterSpacing: 0.3 }}>
        LEFT
      </Text>
    </View>
  )
}

// ─── SectionHead ─────────────────────────────────────────────────────────────
function SectionHead({ thin, bold, onPress }: { thin: string; bold: string; onPress?: () => void }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
      paddingHorizontal: 20, marginBottom: 16,
    }}>
      <View>
        <Text style={{
          fontFamily: 'Inter_300Light', fontSize: 10, color: '#9A9A9A',
          letterSpacing: 2.5, textTransform: 'uppercase',
        }}>
          {thin}
        </Text>
        <Text style={{
          fontFamily: 'Inter_900Black', fontSize: 24, color: '#000000', lineHeight: 28, marginTop: 1,
        }}>
          {bold}
        </Text>
      </View>
      {onPress && (
        <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 4 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#6B7280' }}>see all</Text>
          <ArrowUpRight size={13} color='#6B7280' />
        </Pressable>
      )}
    </View>
  )
}

// ─── PressCard ────────────────────────────────────────────────────────────────
function PressCard({ onPress, style, children }: { onPress: () => void; style?: any; children: any }) {
  const sc = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { sc.value = withSpring(0.965, { damping: 20, stiffness: 420 }) }}
        onPressOut={() => { sc.value = withSpring(1, { damping: 14, stiffness: 280 }) }}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const mode = useUiStore((s) => s.mode)
  const setMode = useUiStore((s) => s.setMode)
  const { events, fetchEvents, loading, setFilter, filters } = useEventStore()

  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y },
  })

  const heroParallax = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(scrollY.value, [0, 600], [0, 90], Extrapolation.CLAMP),
    }],
  }))

  useEffect(() => { fetchEvents() }, [])

  const activeCategory = filters.category ?? 'all'
  let allEvents = events.filter(e => e.status !== 'completed' && e.status !== 'cancelled')
  if (activeCategory !== 'all') {
    allEvents = allEvents.filter(e => e.category === activeCategory)
  }

  const liveEvents = events.filter(e => e.status === 'live')
  const heroEvent = allEvents.find(e => e.status === 'live') ?? allEvents[0]
  const featuredEvents = allEvents.filter(e => e.prize_pool > 0 || e.entry_fee === 0).slice(0, 6)
  const endingEvents = allEvents.filter(e => {
    const pct = e.current_participants / Math.max(e.max_participants, 1)
    return pct > 0.45 && e.status !== 'live'
  }).slice(0, 5)

  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2) ?? 'U'
  const bigCard = featuredEvents[0]
  const smallCards = featuredEvents.slice(1, 3)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
      }}>
        <Image source={require('../../assets/logo_h.png')} style={{ width: 116, height: 34 }} resizeMode="contain" />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Host / Participant toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 19, padding: 3 }}>
            <Pressable
              onPress={() => setMode('participant')}
              style={{ paddingHorizontal: 12, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === 'participant' ? '#000000' : 'transparent' }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: mode === 'participant' ? '#FFFFFF' : '#71717A' }}>Play</Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode('host'); router.push('/host-dashboard' as any) }}
              style={{ paddingHorizontal: 12, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === 'host' ? '#000000' : 'transparent' }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: mode === 'host' ? '#FFFFFF' : '#71717A' }}>Host</Text>
            </Pressable>
          </View>
          <Pressable style={{
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={18} color='#4A4A4A' strokeWidth={1.75} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/profile' as any)}
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FFFFFF' }}>{initials}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── SEARCH + FILTER ───────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => router.push('/search' as any)}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: '#F4F4F4', borderRadius: 24,
            paddingHorizontal: 16, height: 44,
          }}
        >
          <Search size={16} color='#9A9A9A' strokeWidth={2} />
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#ACACAC', flex: 1 }}>
            Team, sport or venue...
          </Text>
        </Pressable>
        <Pressable style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center',
        }}>
          <SlidersHorizontal size={18} color='#FFFFFF' strokeWidth={2} />
        </Pressable>
      </View>

      {/* ── CATEGORY CHIPS ────────────────────────────────────────────────── */}
      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={CHIPS} keyExtractor={i => i.key}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, paddingTop: 2, gap: 8 }}
        renderItem={({ item }) => {
          const active = activeCategory === item.key
          return (
            <Pressable
              onPress={() => setFilter('category', item.key)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 20, paddingVertical: 8,
                borderRadius: 0, alignSelf: 'flex-start',
                backgroundColor: active ? '#000000' : '#EBEBEB',
                ...(Platform.OS === 'web' ? {
                  clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)',
                } : {}),
              } as any}
            >
              <Text style={{ fontSize: 13 }}>{item.emoji}</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: active ? '#FFFFFF' : '#4A4A4A' }}>
                {item.label}
              </Text>
            </Pressable>
          )
        }}
      />

      {/* ── MAIN SCROLL ───────────────────────────────────────────────────── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        {heroEvent && (
          <View style={{ marginHorizontal: 16, borderRadius: 22, overflow: 'hidden', height: HERO_H }}>
            {/* Parallax image layer */}
            <Animated.View style={[{
              position: 'absolute', top: -60, left: 0, right: 0, bottom: -60,
            }, heroParallax]}>
              <Image
                source={categoryMeta[heroEvent.category].image}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </Animated.View>

            {/* Top dark tint */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' }} />
            {/* Bottom gradient */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.01)' }}>
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', backgroundColor: 'rgba(0,0,0,0.55)' }} />
            </View>

            {/* Live / Top badge */}
            <View style={{ position: 'absolute', top: 14, left: 14 }}>
              {heroEvent.status === 'live' ? (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: '#000000', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                }}>
                  <LiveDot />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFFFFF', letterSpacing: 1 }}>LIVE NOW</Text>
                </View>
              ) : (
                <View style={{
                  backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
                }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFFFFF', letterSpacing: 1 }}>
                    {heroEvent.prize_pool > 0 ? `🏆 TOP EVENT` : `TOP EVENT`}
                  </Text>
                </View>
              )}
            </View>

            {/* Glassmorphism bottom panel */}
            <View style={{
              position: 'absolute', bottom: 14, left: 14, right: 14,
              borderRadius: 18, padding: 14, overflow: 'hidden',
              ...(Platform.OS === 'web' ? {
                backdropFilter: 'blur(20px) saturate(160%)',
                backgroundColor: 'rgba(255,255,255,0.11)',
                border: '1px solid rgba(255,255,255,0.18)',
              } : {
                backgroundColor: 'rgba(5,5,5,0.68)',
              }),
            } as any}>
              <Text style={{
                fontFamily: 'Inter_900Black', fontSize: 18, color: '#FFFFFF',
                lineHeight: 23, marginBottom: 8,
              }} numberOfLines={2}>
                {heroEvent.title.toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                    {categoryMeta[heroEvent.category].label}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)' }}>·</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.65)' }} numberOfLines={1}>
                    {heroEvent.date}
                  </Text>
                  {heroEvent.entry_fee === 0 && (
                    <>
                      <Text style={{ color: 'rgba(255,255,255,0.3)' }}>·</Text>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#FFFFFF' }}>FREE</Text>
                    </>
                  )}
                </View>
                <Pressable
                  onPress={() => router.push(`/events/${heroEvent.id}` as any)}
                  style={{
                    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8,
                    borderRadius: 24, marginLeft: 8,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#000000' }}>Join →</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ── LIVE TICKER ───────────────────────────────────────────────────── */}
        {liveEvents.length > 0 && (
          <Animated.View entering={FadeInDown.delay(60).springify()} style={{ marginTop: 14, marginHorizontal: 16 }}>
            <View style={{
              backgroundColor: '#000000', borderRadius: 14,
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, overflow: 'hidden',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10 }}>
                <LiveDot />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF', letterSpacing: 1.8 }}>LIVE</Text>
              </View>
              <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 10 }} />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={liveEvents}
                keyExtractor={i => i.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ gap: 20, paddingVertical: 10, alignItems: 'center' }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => router.push('/live' as any)}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.8)' }} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </Animated.View>
        )}

        {/* ── FEATURED / BENTO GRID ─────────────────────────────────────────── */}
        {bigCard && (
          <Animated.View entering={FadeInDown.delay(80).springify()} style={{ marginTop: 30 }}>
            <SectionHead thin="featured" bold="THIS WEEK" onPress={() => router.push('/discover' as any)} />

            <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 10 }}>
              {/* Big card */}
              <PressCard
                onPress={() => router.push(`/events/${bigCard.id}` as any)}
                style={{ flex: 1.4 }}
              >
                <View style={{ borderRadius: 18, overflow: 'hidden', height: 226, backgroundColor: '#111' }}>
                  <Image
                    source={categoryMeta[bigCard.category].image}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' }} />
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.65)' }} />

                  {bigCard.prize_pool > 0 && (
                    <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' }}>
                        🏆 {formatCurrency(bigCard.prize_pool)}
                      </Text>
                    </View>
                  )}
                  {bigCard.entry_fee === 0 && bigCard.prize_pool === 0 && (
                    <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' }}>FREE</Text>
                    </View>
                  )}

                  <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, color: '#FFFFFF', marginBottom: 4 }} numberOfLines={2}>
                      {bigCard.title.toUpperCase()}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                      {bigCard.date}  ·  {bigCard.location.city}
                    </Text>
                  </View>
                </View>
              </PressCard>

              {/* Small stack */}
              <View style={{ flex: 1, gap: 10 }}>
                {smallCards.map((item) => (
                  <PressCard
                    key={item.id}
                    onPress={() => router.push(`/events/${item.id}` as any)}
                    style={{ flex: 1 }}
                  >
                    <View style={{ borderRadius: 14, overflow: 'hidden', height: 108, backgroundColor: '#111' }}>
                      <Image
                        source={categoryMeta[item.category].image}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.42)' }} />
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.58)' }} />
                      <View style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFFFFF' }} numberOfLines={2}>
                          {item.title.toUpperCase()}
                        </Text>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                          {item.date}
                        </Text>
                      </View>
                    </View>
                  </PressCard>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── BROWSE BY SPORT ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginTop: 34 }}>
          <SectionHead thin="browse" bold="BY SPORT" onPress={() => router.push('/discover' as any)} />
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={SPORTS_GRID} keyExtractor={i => i.key}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 4 }}
            renderItem={({ item, index }) => {
              const dark = index % 2 === 0
              return (
                <PressCard
                  onPress={() => { setFilter('category', item.key as EventCategory); router.push('/discover' as any) }}
                  style={{ width: 104, height: 140 }}
                >
                  <View style={{
                    width: 104, height: 140, borderRadius: 20, overflow: 'hidden',
                    backgroundColor: '#111111',
                    ...(Platform.OS === 'web'
                      ? { boxShadow: '0 4px 18px rgba(0,0,0,0.22)' } as any
                      : { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }),
                  }}>
                    {/* Cover photo */}
                    <Image
                      source={item.image}
                      style={{ position: 'absolute', width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    {/* Dark gradient overlay */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.58)' }} />
                    {/* Label */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 9, paddingHorizontal: 8 }}>
                      <Text style={{
                        fontFamily: 'Inter_700Bold', fontSize: 9,
                        color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase',
                      }}>
                        {item.label}
                      </Text>
                    </View>
                  </View>
                </PressCard>
              )
            }}
          />
        </Animated.View>

        {/* ── FILLING UP / ENDING SOON (peek-scroll) ────────────────────────── */}
        {endingEvents.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).springify()} style={{ marginTop: 34 }}>
            <SectionHead thin="filling up" bold="ENDING SOON" />
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={endingEvents} keyExtractor={i => i.id}
              snapToInterval={W * 0.78 + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item, index }) => {
                const meta = categoryMeta[item.category]
                const spotsLeft = Math.max(0, item.max_participants - item.current_participants)
                const pct = Math.min(item.current_participants / Math.max(item.max_participants, 1), 1)
                return (
                  <Animated.View entering={FadeInRight.delay(index * 70).springify()}>
                    <PressCard
                      onPress={() => router.push(`/events/${item.id}` as any)}
                      style={{ width: W * 0.78 }}
                    >
                      <View style={{
                        borderRadius: 18, overflow: 'hidden', backgroundColor: '#FFFFFF',
                        borderWidth: 1, borderColor: '#EFEFEF',
                        ...(Platform.OS === 'web'
                          ? { boxShadow: '0px 4px 20px rgba(0,0,0,0.09)' } as any
                          : { shadowColor: '#000', shadowOpacity: 0.09, shadowRadius: 14, elevation: 3 }),
                      }}>
                        {/* Image */}
                        <View style={{ height: 134, backgroundColor: '#111' }}>
                          <Image source={meta.image} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
                          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.22)' }} />
                          <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' }}>
                              🔥 {Math.round(pct * 100)}% filled
                            </Text>
                          </View>
                          {item.status === 'live' && (
                            <View style={{ position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                              <LiveDot />
                              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' }}>LIVE</Text>
                            </View>
                          )}
                        </View>

                        {/* Info row */}
                        <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#000000', marginBottom: 3 }} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9A9A9A' }}>
                              {item.date}  ·  {item.location.city}
                            </Text>
                            {/* Fill bar */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 }}>
                              <View style={{ flex: 1, height: 4, backgroundColor: '#E8E8E8', borderRadius: 2, overflow: 'hidden' }}>
                                <View style={{ height: 4, width: `${Math.round(pct * 100)}%` as any, backgroundColor: '#000000', borderRadius: 2 }} />
                              </View>
                            </View>
                          </View>
                          <SpotsRing spots={spotsLeft} maxSpots={item.max_participants} size={52} />
                        </View>
                      </View>
                    </PressCard>
                  </Animated.View>
                )
              }}
            />
          </Animated.View>
        )}

        {/* ── ALL / UPCOMING ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={{ marginTop: 34 }}>
          <SectionHead
            thin={activeCategory !== 'all'
              ? (CHIPS.find(c => c.key === activeCategory)?.label ?? 'upcoming')
              : 'upcoming'
            }
            bold={activeCategory !== 'all' ? 'EVENTS' : 'ALL EVENTS'}
            onPress={() => router.push('/discover' as any)}
          />

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9A9A9A' }}>Loading events...</Text>
            </View>
          ) : allEvents.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🔍</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0A0A0A', textAlign: 'center' }}>No events found</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#9A9A9A', textAlign: 'center', marginTop: 4 }}>
                Try a different sport or filter
              </Text>
            </View>
          ) : (
            allEvents.slice(0, 5).map((event, i) => {
              const meta = categoryMeta[event.category]
              const status = statusMeta[event.status]
              return (
                <Animated.View key={event.id} entering={FadeInDown.delay(i * 50).springify()}>
                  <PressCard
                    onPress={() => router.push(`/events/${event.id}` as any)}
                    style={{ marginHorizontal: 16, marginBottom: 12 }}
                  >
                    <View style={{
                      borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF',
                      borderWidth: 1, borderColor: '#EFEFEF',
                      ...(Platform.OS === 'web'
                        ? { boxShadow: '0px 2px 12px rgba(0,0,0,0.07)' } as any
                        : { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 }),
                    }}>
                      {/* Banner */}
                      <View style={{ height: 120, backgroundColor: '#1A1A1A' }}>
                        <Image source={meta.image} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="cover" />
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' }} />
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(0,0,0,0.55)' }} />

                        {event.status === 'live' ? (
                          <View style={{ position: 'absolute', top: 10, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                            <LiveDot />
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' }}>LIVE</Text>
                          </View>
                        ) : event.prize_pool > 0 ? (
                          <View style={{ position: 'absolute', top: 10, left: 12, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' }}>🏆 {formatCurrency(event.prize_pool)}</Text>
                          </View>
                        ) : event.entry_fee === 0 ? (
                          <View style={{ position: 'absolute', top: 10, left: 12, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' }}>FREE</Text>
                          </View>
                        ) : null}

                        <View style={{ position: 'absolute', bottom: 9, left: 12, right: 12 }}>
                          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, color: '#FFFFFF' }} numberOfLines={1}>
                            {event.title.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Card info */}
                      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#000000' }}>{meta.label}</Text>
                            <Text style={{ color: '#C0C0C0' }}>·</Text>
                            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9A9A9A' }} numberOfLines={1}>
                              {event.date}  ·  {event.time}
                            </Text>
                          </View>
                          <View style={{
                            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8,
                            backgroundColor: event.entry_fee === 0 ? '#000000' : '#F2F2F2',
                          }}>
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: event.entry_fee === 0 ? '#FFFFFF' : '#0A0A0A' }}>
                              {event.entry_fee === 0 ? 'FREE' : formatCurrency(event.entry_fee)}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
                          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9A9A9A' }} numberOfLines={1}>
                            📍 {event.location.venue_name}, {event.location.city}
                          </Text>
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: status.bg }}>
                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: status.text }}>{status.label}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </PressCard>
                </Animated.View>
              )
            })
          )}
        </Animated.View>

      </Animated.ScrollView>
    </SafeAreaView>
  )
}
