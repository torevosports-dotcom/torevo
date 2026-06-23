import { View, Text, Pressable, Image, Dimensions, FlatList } from 'react-native'
import { Plus, Play, Award } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { categoryMeta, formatCurrency } from '../lib/utils'
import { toast } from '../stores/toastStore'
import type { EventCategory } from '../lib/types'

const { width: W } = Dimensions.get('window')
const GAP = 12
const CARD_W = W - 44                 // a sliver of the next card peeks on the right
const CARD_H = Math.min(Math.round(CARD_W * 1.12), 480)
const SNAP = CARD_W + GAP
const ROTATE_MS = 4500

// JioHotstar-style hero: big rounded card, peeking next card, ranking pill,
// title + meta bottom-left, stacked +/play buttons bottom-right. Auto-rotates, no dots.
function HeroCard({ event, rank, onPress }: { event: any; rank: number; onPress: () => void }) {
  const m = categoryMeta[event.category as EventCategory] ?? categoryMeta.other
  return (
    <View style={{ width: CARD_W, height: CARD_H, marginRight: GAP, borderRadius: 22, overflow: 'hidden', backgroundColor: '#0E0E0E' }}>
      <Image source={m.image} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      {/* bottom gradient for legibility */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', backgroundColor: 'rgba(0,0,0,0.32)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '20%', backgroundColor: 'rgba(0,0,0,0.82)' }} />

      {/* top-left ranking pill */}
      <View style={{ position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
        <Award size={13} color="#FFD479" fill="#FFD479" />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>{`#${rank} in ${m.label} Today`}</Text>
      </View>

      {/* top-right status chip */}
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

      {/* bottom-left: title + meta + date */}
      <View style={{ position: 'absolute', left: 18, right: 84, bottom: 18 }}>
        <Text numberOfLines={2} style={{ fontFamily: 'Inter_900Black', fontSize: 25, lineHeight: 28, color: '#fff', letterSpacing: -0.5 }}>{event.title}</Text>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 7 }}>
          {m.label}{event.location?.city ? `  ·  ${event.location.city}` : ''}{event.entry_fee === 0 ? '  ·  Free' : ''}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
          🗓️  {event.date}{event.time ? `  ·  ${event.time}` : ''}
        </Text>
      </View>

      {/* bottom-right: stacked + / play buttons */}
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

export default function HeroCarousel({ items, onPress }: { items: any[]; onPress: (id: string) => void }) {
  const ref = useRef<FlatList<any>>(null)
  const [page, setPage] = useState(0)
  const pausedUntil = useRef(0)

  useEffect(() => {
    if (items.length < 2) return
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      setPage((p) => {
        const n = (p + 1) % items.length
        ref.current?.scrollToOffset({ offset: n * SNAP, animated: true })
        return n
      })
    }, ROTATE_MS)
    return () => clearInterval(t)
  }, [items.length])

  if (!items.length) return null

  return (
    <FlatList
      ref={ref}
      data={items}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={SNAP}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
      keyExtractor={(e) => e.id}
      onScrollBeginDrag={() => { pausedUntil.current = Date.now() + 8000 }}
      onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / SNAP))}
      initialNumToRender={2}
      maxToRenderPerBatch={3}
      windowSize={5}
      renderItem={({ item, index }) => <HeroCard event={item} rank={index + 1} onPress={() => onPress(item.id)} />}
    />
  )
}
