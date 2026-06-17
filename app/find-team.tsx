import { ScrollView, View, Text, Pressable, TextInput, FlatList, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Search, X, CheckCircle2, Star } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { categoryMeta } from '../lib/utils'
import type { EventCategory } from '../lib/types'

interface Player {
  id: string
  name: string
  sport: EventCategory
  skill: string
  city: string
  rating: number
  events: number
  verified: boolean
  looking_for: string
  available: string
}

const SKILL_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  beginner:     { label: 'Beginner',     bg: '#F4F4F5', text: '#71717A' },
  intermediate: { label: 'Intermediate', bg: '#F4F4F5', text: '#52525B' },
  advanced:     { label: 'Advanced',     bg: '#27272A', text: '#E4E4E7' },
  pro:          { label: 'Pro',          bg: '#09090B', text: 'white' },
}

const SPORT_FILTERS: { key: EventCategory | 'all'; emoji: string }[] = [
  { key: 'all', emoji: '🔍' },
  { key: 'cricket', emoji: '🏏' },
  { key: 'football', emoji: '⚽' },
  { key: 'kabaddi', emoji: '🤼' },
  { key: 'badminton', emoji: '🏸' },
  { key: 'basketball', emoji: '🏀' },
  { key: 'volleyball', emoji: '🏐' },
  { key: 'pickleball', emoji: '🥒' },
]

export default function FindTeamScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState<EventCategory | 'all'>('all')
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('visible', true)
        .order('rating', { ascending: false })
      if (data) {
        setPlayers(data.map((p) => ({
          id: p.id,
          name: p.name,
          sport: p.sport as EventCategory,
          skill: p.skill_level,
          city: p.city,
          rating: p.rating,
          events: p.events_count,
          verified: p.verified,
          looking_for: p.looking_for,
          available: p.available,
        })))
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = players.filter((p) => {
    const matchSport = sport === 'all' || p.sport === sport
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase())
    return matchSport && matchSearch
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.push('/')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color="#09090B" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#09090B' }}>Find Team</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#A1A1AA' }}>{filtered.length} players nearby</Text>
        </View>
      </View>

      {/* Search + filters */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: '#F4F4F5', borderRadius: 14,
          paddingHorizontal: 12, height: 44,
          borderWidth: 1, borderColor: '#E4E4E7',
          marginBottom: 12,
        }}>
          <Search size={15} color="#A1A1AA" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search players or city..."
            placeholderTextColor="#A1A1AA"
            style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: '#09090B' }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <X size={14} color="#A1A1AA" />
            </Pressable>
          )}
        </View>

        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={SPORT_FILTERS} keyExtractor={(i) => i.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const meta = item.key !== 'all' ? categoryMeta[item.key] : null
            const active = sport === item.key
            return (
              <Pressable
                onPress={() => setSport(item.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: active ? '#09090B' : '#F4F4F5',
                }}
              >
                <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
                {meta && (
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: active ? 'white' : '#52525B' }}>
                    {meta.label}
                  </Text>
                )}
              </Pressable>
            )
          }}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>👥</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#09090B', marginTop: 12 }}>No players found</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A1A1AA', marginTop: 6 }}>Try a different sport or city</Text>
          </View>
        ) : (
          filtered.map((player, i) => {
            const meta = categoryMeta[player.sport]
            const skill = SKILL_BADGE[player.skill] ?? SKILL_BADGE.beginner

            return (
              <Animated.View key={player.id} entering={FadeInDown.delay(i * 60).springify()}>
                <View style={{
                  marginHorizontal: 16, marginBottom: 12,
                  backgroundColor: 'white', borderRadius: 18,
                  borderWidth: 1, borderColor: '#E4E4E7',
                  padding: 16,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                    {/* Avatar */}
                    <View style={{
                      width: 52, height: 52, borderRadius: 26,
                      backgroundColor: '#09090B',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: 'white' }}>
                        {player.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#09090B' }}>{player.name}</Text>
                        {player.verified && <CheckCircle2 size={14} color="#09090B" fill="#09090B" strokeWidth={2} />}
                      </View>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#71717A', marginTop: 2 }}>
                        📍 {player.city}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#F4F4F5' }}>
                          <Text style={{ fontSize: 12 }}>{meta.emoji}</Text>
                          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#52525B' }}>{meta.label}</Text>
                        </View>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: skill.bg }}>
                          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: skill.text }}>{skill.label}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Rating */}
                    <View style={{ alignItems: 'center', gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Star size={12} color="#09090B" fill="#09090B" />
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#09090B' }}>{player.rating}</Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#A1A1AA' }}>{player.events} events</Text>
                    </View>
                  </View>

                  {/* Looking for */}
                  <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F4F4F5' }}>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#52525B', lineHeight: 18 }}>
                      "{player.looking_for}"
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#A1A1AA', marginTop: 4 }}>
                      🗓 Available: {player.available}
                    </Text>
                  </View>

                  {/* Connect button */}
                  <Pressable style={{ marginTop: 12, backgroundColor: '#09090B', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'white' }}>Connect</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}
