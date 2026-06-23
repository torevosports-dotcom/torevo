import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Trophy } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useEventStore } from '../stores/eventStore'
import { categoryMeta, THEME } from '../lib/utils'
import type { EventCategory } from '../lib/types'

export default function Leaderboard() {
  const router = useRouter()
  const fetchTopPlayers = useEventStore((s) => s.fetchTopPlayers)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Record<string, any[]>>({})
  const [cat, setCat] = useState<string>('')

  useEffect(() => {
    (async () => {
      const d = await fetchTopPlayers()
      setData(d)
      const cats = Object.keys(d)
      setCat(cats[0] ?? '')
      setLoading(false)
    })()
  }, [])

  const cats = Object.keys(data)
  const rows = data[cat] ?? []

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.navigate('/' as any))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={THEME.text} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: THEME.text, flex: 1 }}>Top Players</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={THEME.text} /></View>
      ) : cats.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Trophy size={40} color={THEME.textTertiary} strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: THEME.text, marginTop: 12 }}>No stats yet</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.textTertiary, textAlign: 'center', marginTop: 4 }}>
            Player rankings appear once matches are scored.
          </Text>
        </View>
      ) : (
        <>
          {/* Sport tabs */}
          <View style={{ height: 52 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
              {cats.map((c) => {
                const m = categoryMeta[c as EventCategory] ?? categoryMeta.other
                const active = c === cat
                return (
                  <Pressable key={c} onPress={() => setCat(c)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: active ? '#000' : '#fff', borderWidth: 1, borderColor: active ? '#000' : THEME.border }}>
                    <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: active ? '#fff' : THEME.textSecondary }}>{m.label}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 4 }}>
            {/* header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 }}>
              <Text style={{ width: 34, fontFamily: 'Inter_700Bold', fontSize: 10, color: THEME.textTertiary }}>#</Text>
              <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 10, color: THEME.textTertiary }}>PLAYER</Text>
              <Text style={{ width: 44, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 10, color: THEME.textTertiary }}>MAT</Text>
              <Text style={{ width: 44, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 10, color: THEME.textTertiary }}>BEST</Text>
              <Text style={{ width: 54, textAlign: 'right', fontFamily: 'Inter_700Bold', fontSize: 10, color: THEME.textTertiary }}>TOTAL</Text>
            </View>
            {rows.map((p, i) => (
              <Animated.View key={p.name + i} entering={FadeInDown.delay(Math.min(i, 10) * 40).springify()}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: i < 3 ? '#000' : THEME.card, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderColor: i < 3 ? '#000' : THEME.border }}>
                  <Text style={{ width: 34, fontFamily: 'Inter_900Black', fontSize: 14, color: i < 3 ? '#fff' : THEME.text }}>{medal(i) ?? i + 1}</Text>
                  <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 14, color: i < 3 ? '#fff' : THEME.text }}>{p.name}</Text>
                  <Text style={{ width: 44, textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 13, color: i < 3 ? 'rgba(255,255,255,0.75)' : THEME.textSecondary }}>{p.matches}</Text>
                  <Text style={{ width: 44, textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 13, color: i < 3 ? 'rgba(255,255,255,0.75)' : THEME.textSecondary }}>{p.best}</Text>
                  <Text style={{ width: 54, textAlign: 'right', fontFamily: 'Inter_900Black', fontSize: 15, color: i < 3 ? '#fff' : THEME.text }}>{p.total}</Text>
                </View>
              </Animated.View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  )
}
