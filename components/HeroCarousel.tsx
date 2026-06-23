import { View, Text, Pressable, Image, Dimensions } from 'react-native'
import { Plus, Play, Award } from 'lucide-react-native'
import Animated, { useAnimatedRef, useFrameCallback, useSharedValue, scrollTo } from 'react-native-reanimated'
import { categoryMeta, formatCurrency } from '../lib/utils'
import { toast } from '../stores/toastStore'
import type { EventCategory } from '../lib/types'

const { width: W } = Dimensions.get('window')
const GAP = 12
const CARD_W = W - 44                 // a sliver of the next card peeks on the right
const CARD_H = Math.min(Math.round(CARD_W * 1.12), 480)
const SNAP = CARD_W + GAP
const SPEED = 42                      // px/sec — gentle continuous glide
const RESUME_MS = 5000                // wait after a manual swipe before auto-scroll resumes

// JioHotstar-style hero card.
function HeroCard({ event, rank, onPress }: { event: any; rank: number; onPress: () => void }) {
  const m = categoryMeta[event.category as EventCategory] ?? categoryMeta.other
  return (
    <View style={{ width: CARD_W, height: CARD_H, marginRight: GAP, borderRadius: 22, overflow: 'hidden', backgroundColor: '#0E0E0E' }}>
      <Image source={m.image} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', backgroundColor: 'rgba(0,0,0,0.32)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '20%', backgroundColor: 'rgba(0,0,0,0.82)' }} />

      <View style={{ position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
        <Award size={13} color="#FFD479" fill="#FFD479" />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>{`#${rank} in ${m.label} Today`}</Text>
      </View>

      {event.status === 'live' ? (
        <View style={{ position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 9, color: '#fff', letterSpacing: 1 }}>LIVE</Text>
        </View>
      ) : event.prize_pool > 0 ? (
        <View style={{ position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#fff' }}>{`🏆 ${formatCurrency(event.prize_pool)}`}</Text>
        </View>
      ) : null}

      <View style={{ position: 'absolute', left: 18, right: 84, bottom: 18 }}>
        <Text numberOfLines={2} style={{ fontFamily: 'Inter_900Black', fontSize: 25, lineHeight: 28, color: '#fff', letterSpacing: -0.5 }}>{event.title}</Text>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 7 }}>
          {m.label}{event.location?.city ? `  ·  ${event.location.city}` : ''}{event.entry_fee === 0 ? '  ·  Free' : ''}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
          🗓️  {event.date}{event.time ? `  ·  ${event.time}` : ''}
        </Text>
      </View>

      <View style={{ position: 'absolute', right: 14, bottom: 18, alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => toast('Added to your list', 'success')} hitSlop={6}
          style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={22} color="#fff" strokeWidth={2.6} />
        </Pressable>
        <Pressable onPress={onPress} hitSlop={6}
          style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Play size={20} color="#000" fill="#000" />
        </Pressable>
      </View>
    </View>
  )
}

// Continuous, seamless horizontal LOOP (matches the reference motion graphic):
// content is duplicated and the scroll position wraps, so it glides forever.
// Pauses while you touch, resumes a few seconds after you let go.
export default function HeroCarousel({ items, onPress }: { items: any[]; onPress: (id: string) => void }) {
  const aref = useAnimatedRef<Animated.ScrollView>()
  const x = useSharedValue(0)
  const paused = useSharedValue(false)
  const loop = items.length > 1
  const setWidth = items.length * SNAP
  const data = loop ? [...items, ...items] : items

  useFrameCallback((frame) => {
    'worklet'
    if (!loop || paused.value) return
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000
    let nx = x.value + dt * SPEED
    if (nx >= setWidth) nx -= setWidth
    x.value = nx
    scrollTo(aref, nx, 0, false)
  })

  const pause = () => { paused.value = true }
  const resume = (e: any) => {
    const off = e?.nativeEvent?.contentOffset?.x ?? 0
    x.value = loop ? off % setWidth : off
    setTimeout(() => { paused.value = false }, RESUME_MS)
  }

  if (!items.length) return null

  return (
    <Animated.ScrollView
      ref={aref}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
      onScrollBeginDrag={pause}
      onScrollEndDrag={resume}
      onMomentumScrollEnd={resume}
    >
      {data.map((item, i) => (
        <HeroCard key={`${item.id}-${i}`} event={item} rank={(i % items.length) + 1} onPress={() => onPress(item.id)} />
      ))}
    </Animated.ScrollView>
  )
}
