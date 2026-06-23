import { View, Text, Pressable, Image, Dimensions } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useEffect, useRef, useState } from 'react'
import { categoryMeta } from '../lib/utils'
import type { EventCategory } from '../lib/types'

const { width: W } = Dimensions.get('window')
const PANEL_H = Math.min(Math.round(W * 1.15), 440)
const ROTATE_MS = 3500

// Native re-creation of the "expanding panel selector": the active panel grows,
// the others shrink to slivers. Auto-advances; tap to focus. No dots.
function Panel({ event, active, onPress, onFocus }: { event: any; active: boolean; onPress: () => void; onFocus: () => void }) {
  const m = categoryMeta[event.category as EventCategory] ?? categoryMeta.other
  const style = useAnimatedStyle(() => ({ flex: withTiming(active ? 7 : 1, { duration: 550 }) }))
  const textStyle = useAnimatedStyle(() => ({ opacity: withTiming(active ? 1 : 0, { duration: active ? 600 : 150 }) }))
  return (
    <Animated.View style={[{ minWidth: 46, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111', borderWidth: 2, borderColor: active ? '#fff' : 'transparent' }, style]}>
      <Pressable style={{ flex: 1 }} onPress={active ? onPress : onFocus}>
        <Image source={m.image} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '28%', backgroundColor: 'rgba(0,0,0,0.8)' }} />
        {event.status === 'live' && active && (
          <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#000', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 9, color: '#fff', letterSpacing: 1 }}>LIVE</Text>
          </View>
        )}
        {/* Label */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,20,0.85)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' }}>
            <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
          </View>
          <Animated.View style={[{ flex: 1 }, textStyle]}>
            <Text numberOfLines={1} style={{ fontFamily: 'Inter_900Black', fontSize: 17, color: '#fff' }}>{event.title}</Text>
            <Text numberOfLines={1} style={{ fontFamily: 'Inter_500Medium', fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {m.label}{event.location?.city ? `  ·  ${event.location.city}` : ''}
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default function ExpandingSelector({ items, onPress }: { items: any[]; onPress: (id: string) => void }) {
  const [active, setActive] = useState(0)
  const pausedUntil = useRef(0)

  useEffect(() => {
    if (items.length < 2) return
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      setActive((p) => (p + 1) % items.length)
    }, ROTATE_MS)
    return () => clearInterval(t)
  }, [items.length])

  if (!items.length) return null

  const focus = (i: number) => { pausedUntil.current = Date.now() + 6000; setActive(i) }

  return (
    <View style={{ flexDirection: 'row', height: PANEL_H, paddingHorizontal: 14, gap: 8, marginTop: 4 }}>
      {items.map((event, i) => (
        <Panel
          key={event.id}
          event={event}
          active={i === active}
          onFocus={() => focus(i)}
          onPress={() => onPress(event.id)}
        />
      ))}
    </View>
  )
}
