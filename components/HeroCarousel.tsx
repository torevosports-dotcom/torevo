import { View, Text, Pressable, Image, Dimensions, FlatList } from 'react-native'
import { Plus, Play, Award } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { categoryMeta, formatCurrency } from '../lib/utils'
import { toast } from '../stores/toastStore'
import type { EventCategory } from '../lib/types'

const { width: W } = Dimensions.get('window')
const GAP = 12
const CARD_W = W - 44                 // a sliver of the next card peeks on the right
const CARD_H = Math.min(Math.round(CARD_W * 1.12), 480)
const SNAP = CARD_W + GAP
const INTERVAL_MS = 3800              // auto-advance one card every ~3.8s (JioHotstar feel)
const RESUME_MS = 6000               // pause auto-advance for a bit after a manual swipe
const SLIDE_MS = 420                 // ~ duration of the animated snap before a seamless reset

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

// JioHotstar spotlight: auto-advances ONE card at a time with a smooth snap,
// next card peeking, and loops seamlessly (data duplicated; offset resets at the
// seam so it never jumps). Swiping pauses auto-advance, then it resumes.
export default function HeroCarousel({ items, onPress }: { items: any[]; onPress: (id: string) => void }) {
  const ref = useRef<FlatList<any>>(null)
  const idx = useRef(0)
  const pausedUntil = useRef(0)
  const loop = items.length > 1
  const data = loop ? [...items, ...items] : items

  useEffect(() => {
    if (!loop) return
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      const next = idx.current + 1
      idx.current = next
      ref.current?.scrollToOffset({ offset: next * SNAP, animated: true })
      // reached the first card of the duplicate set → snap back to the original
      // (identical content) without animation, so the loop is seamless.
      if (next >= items.length) {
        setTimeout(() => {
          idx.current = next - items.length
          ref.current?.scrollToOffset({ offset: idx.current * SNAP, animated: false })
        }, SLIDE_MS)
      }
    }, INTERVAL_MS)
    return () => clearInterval(t)
  }, [items.length])

  const onSettle = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SNAP)
    idx.current = i
    pausedUntil.current = Date.now() + RESUME_MS
    if (loop && i >= items.length) {
      idx.current = i - items.length
      ref.current?.scrollToOffset({ offset: idx.current * SNAP, animated: false })
    }
  }

  if (!items.length) return null

  return (
    <FlatList
      ref={ref}
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={SNAP}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
      keyExtractor={(e, i) => `${e.id}-${i}`}
      onScrollBeginDrag={() => { pausedUntil.current = Date.now() + RESUME_MS }}
      onMomentumScrollEnd={onSettle}
      initialNumToRender={2}
      maxToRenderPerBatch={3}
      windowSize={5}
      renderItem={({ item, index }) => <HeroCard event={item} rank={(index % items.length) + 1} onPress={() => onPress(item.id)} />}
    />
  )
}
