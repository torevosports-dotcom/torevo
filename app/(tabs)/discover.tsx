import { ScrollView, View, Text, TextInput, Pressable, FlatList, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search, SlidersHorizontal, X, Shield, ChevronRight } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useEventStore } from '../../stores/eventStore'
import { categoryMeta, statusMeta, formatCurrency, getRegistrationPercentage, getSpotsLeft, THEME } from '../../lib/utils'
import type { EventCategory, EventType } from '../../lib/types'
import { Platform } from 'react-native'

const CATEGORIES: { key: EventCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all',         label: 'All',         emoji: '🔍' },
  { key: 'cricket',    label: 'Cricket',     emoji: '🏏' },
  { key: 'football',   label: 'Football',    emoji: '⚽' },
  { key: 'kabaddi',    label: 'Kabaddi',     emoji: '🤼' },
  { key: 'badminton',  label: 'Badminton',   emoji: '🏸' },
  { key: 'basketball', label: 'Basketball',  emoji: '🏀' },
  { key: 'volleyball', label: 'Volleyball',  emoji: '🏐' },
  { key: 'esports',    label: 'Esports',     emoji: '🎮' },
  { key: 'table_tennis', label: 'Table Tennis', emoji: '🏓' },
  { key: 'pickleball', label: 'Pickleball',  emoji: '🥒' },
]

const EVENT_TYPES: { key: EventType | 'all'; label: string }[] = [
  { key: 'all',        label: 'All Types'  },
  { key: 'tournament', label: 'Tournament' },
  { key: 'casual',     label: 'Casual'     },
  { key: 'league',     label: 'League'     },
  { key: 'workshop',   label: 'Workshop'   },
]

export default function DiscoverScreen() {
  const router = useRouter()
  const { filters, setFilter, filteredEvents } = useEventStore()
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<'relevance' | 'price_low' | 'price_high' | 'date'>('relevance')
  const [dateScope, setDateScope] = useState<'all' | 'week' | 'month'>('all')

  const base = filteredEvents()
  const now = Date.now()
  const results = base
    .filter((e) => {
      if (dateScope === 'all') return true
      const t = new Date(e.date).getTime()
      if (isNaN(t)) return true
      const days = (t - now) / 86400000
      return dateScope === 'week' ? days <= 7 : days <= 31
    })
    .slice()
    .sort((a, b) => {
      if (sort === 'price_low') return a.entry_fee - b.entry_fee
      if (sort === 'price_high') return b.entry_fee - a.entry_fee
      if (sort === 'date') return new Date(a.date).getTime() - new Date(b.date).getTime()
      return 0
    })
  const activeFilterCount = [
    filters.category !== 'all',
    filters.event_type !== 'all',
    filters.free_only,
    filters.has_prize_pool,
    filters.city !== '',
  ].filter(Boolean).length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      {/* Sticky top bar */}
      <View style={{ backgroundColor: THEME.card, borderBottomWidth: 1, borderBottomColor: THEME.border }}>
        {/* Title row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
          <Pressable onPress={() => router.navigate('/' as any)}>
            <Image source={require('../../assets/logo_h.png')} style={{ width: 104, height: 30 }} resizeMode="contain" />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F0F0F0' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: THEME.textSecondary }}>{results.length} events</Text>
          </View>
        </View>

        {/* Search + filter row */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 10 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: THEME.bg, borderRadius: 14,
            paddingHorizontal: 12, height: 46,
            borderWidth: 1.5, borderColor: filters.search.length > 0 ? '#000000' : THEME.border,
          }}>
            <Search size={16} color={filters.search.length > 0 ? '#000000' : THEME.textTertiary} />
            <TextInput
              value={filters.search}
              onChangeText={(v) => setFilter('search', v)}
              placeholder="Search events, sports, cities..."
              placeholderTextColor={THEME.textTertiary}
              style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: THEME.text }}
            />
            {filters.search.length > 0 && (
              <Pressable onPress={() => setFilter('search', '')}>
                <X size={14} color={THEME.textTertiary} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            style={{
              width: 46, height: 46, borderRadius: 14,
              backgroundColor: activeFilterCount > 0 ? '#000000' : THEME.bg,
              borderWidth: 1.5, borderColor: activeFilterCount > 0 ? '#000000' : THEME.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={18} color={activeFilterCount > 0 ? '#FFFFFF' : THEME.textSecondary} />
            {activeFilterCount > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: THEME.card }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: '#FFFFFF' }}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Category chips */}
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={CATEGORIES} keyExtractor={i => i.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8, alignItems: 'center' }}
          renderItem={({ item }) => {
            const active = filters.category === item.key
            return (
              <Pressable
                onPress={() => setFilter('category', item.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 20, paddingVertical: 8,
                  borderRadius: 0, alignSelf: 'flex-start',
                  backgroundColor: active ? '#000000' : '#EBEBEB',
                  clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)',
                } as any}
              >
                {item.key === 'pickleball'
                  ? <Image source={require('../../assets/sports/pickleball_icon.png')} style={{ width: 17, height: 17 }} resizeMode="contain" />
                  : <Text style={{ fontSize: 15 }}>{item.emoji}</Text>}
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: active ? '#FFFFFF' : THEME.textSecondary }}>
                  {item.label}
                </Text>
              </Pressable>
            )
          }}
        />
      </View>

      {/* Filter panel */}
      {showFilters && (
        <Animated.View entering={FadeInDown.springify()} style={{ backgroundColor: THEME.card, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: THEME.border }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.text, marginBottom: 10 }}>Event Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {EVENT_TYPES.map(t => (
              <Pressable
                key={t.key}
                onPress={() => setFilter('event_type', t.key)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: filters.event_type === t.key ? '#000000' : '#F5F5F5',
                  borderWidth: 1, borderColor: filters.event_type === t.key ? '#000000' : '#E8E8E8',
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: filters.event_type === t.key ? '#FFFFFF' : THEME.textSecondary }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {[
              { key: 'free_only',      label: '🆓 Free Only',  value: filters.free_only },
              { key: 'has_prize_pool', label: '🏆 Prize Pool', value: filters.has_prize_pool },
            ].map(({ key, label, value }) => (
              <Pressable
                key={key}
                onPress={() => setFilter(key as any, !value)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: value ? '#000000' : '#F5F5F5',
                  borderWidth: 1, borderColor: value ? '#000000' : '#E8E8E8',
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: value ? '#FFFFFF' : THEME.textSecondary }}>{label}</Text>
              </Pressable>
            ))}
            {(activeFilterCount > 0 || dateScope !== 'all' || sort !== 'relevance') && (
              <Pressable
                onPress={() => { useEventStore.getState().resetFilters(); setSort('relevance'); setDateScope('all'); setShowFilters(false) }}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E8E8E8' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.text }}>Clear All</Text>
              </Pressable>
            )}
          </View>

          {/* Area */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.text, marginTop: 16, marginBottom: 8 }}>Area</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.bg, borderRadius: 12, borderWidth: 1.5, borderColor: filters.city ? '#000000' : THEME.border, paddingHorizontal: 12, height: 44 }}>
            <Search size={15} color={filters.city ? '#000' : THEME.textTertiary} />
            <TextInput value={filters.city} onChangeText={(v) => setFilter('city', v)} placeholder="City or area (e.g. Bangalore, Indiranagar)" placeholderTextColor={THEME.textTertiary}
              style={{ flex: 1, marginLeft: 8, fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.text }} />
            {!!filters.city && <Pressable onPress={() => setFilter('city', '')}><X size={14} color={THEME.textTertiary} /></Pressable>}
          </View>

          {/* When */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.text, marginTop: 16, marginBottom: 8 }}>When</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([['all', 'Any time'], ['week', 'This week'], ['month', 'This month']] as const).map(([k, l]) => (
              <Pressable key={k} onPress={() => setDateScope(k)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: dateScope === k ? '#000000' : '#F5F5F5', borderWidth: 1, borderColor: dateScope === k ? '#000000' : '#E8E8E8' }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: dateScope === k ? '#FFFFFF' : THEME.textSecondary }}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Event list */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 14 }}>
        {/* Sort row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.textTertiary }}>Sort</Text>
          {([['relevance', 'Top'], ['price_low', '₹ Low'], ['price_high', '₹ High'], ['date', 'Soonest']] as const).map(([k, l]) => (
            <Pressable key={k} onPress={() => setSort(k)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: sort === k ? '#000000' : '#EFEFEF' }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: sort === k ? '#FFFFFF' : THEME.textSecondary }}>{l}</Text>
            </Pressable>
          ))}
        </View>
        {results.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: THEME.text, textAlign: 'center' }}>No events found</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.textTertiary, textAlign: 'center', marginTop: 6 }}>Try adjusting your filters</Text>
            <Pressable
              onPress={() => { useEventStore.getState().resetFilters(); setSort('relevance'); setDateScope('all') }}
              style={{ marginTop: 16, backgroundColor: '#000000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FFFFFF' }}>Reset Filters</Text>
            </Pressable>
          </View>
        ) : (
          results.map((event, i) => {
            const meta = categoryMeta[event.category]
            const status = statusMeta[event.status]
            const pct = getRegistrationPercentage(event.current_participants, event.max_participants)
            const left = getSpotsLeft(event.current_participants, event.max_participants)
            return (
              <Animated.View key={event.id} entering={FadeInDown.delay(Math.min(i, 8) * 50).springify()}>
                <Pressable
                  onPress={() => router.push(`/events/${event.id}` as any)}
                  style={{
                    marginHorizontal: 16, marginBottom: 14,
                    borderRadius: 16, overflow: 'hidden',
                    backgroundColor: THEME.card,
                    borderWidth: 1, borderColor: THEME.border,
                    ...(Platform.OS === 'web'
                      ? { boxShadow: '0px 2px 12px rgba(0,0,0,0.08)' } as any
                      : { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2 }),
                  }}
                >
                  {/* Sport photo banner */}
                  <View style={{ height: 110, backgroundColor: '#1A1A1A', position: 'relative', overflow: 'hidden' }}>
                    <Image source={meta.image} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' }} />

                    {event.prize_pool > 0 && (
                      <View style={{ position: 'absolute', top: 8, left: 10, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFFFFF' }}>🏆 {formatCurrency(event.prize_pool)} PRIZE</Text>
                      </View>
                    )}
                    {event.entry_fee === 0 && event.prize_pool === 0 && (
                      <View style={{ position: 'absolute', top: 8, left: 10, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFFFFF' }}>FREE ENTRY</Text>
                      </View>
                    )}
                    {event.status === 'live' && (
                      <View style={{ position: 'absolute', top: 8, right: 10, backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' }}>LIVE</Text>
                      </View>
                    )}
                    {event.escrow_protected && (
                      <View style={{ position: 'absolute', bottom: 6, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Shield size={9} color="white" />
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, color: 'white' }}>Escrow</Text>
                      </View>
                    )}
                  </View>

                  {/* Card body */}
                  <View style={{ padding: 14 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: THEME.text, marginBottom: 6 }} numberOfLines={1}>
                      {event.title}
                    </Text>

                    {/* Chips row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: '#F0F0F0' }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#4A4A4A' }}>{meta.label}</Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>·</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: '#F0F0F0' }}>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#4A4A4A' }}>
                          {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                        </Text>
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: status.bg }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: status.text }}>{status.label}</Text>
                      </View>
                    </View>

                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: THEME.textSecondary, marginBottom: 12 }}>
                      📍 {event.location.venue_name}, {event.location.city}  ·  {event.date} at {event.time}
                    </Text>

                    {/* Bottom row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ height: 3, backgroundColor: '#E8E8E8', borderRadius: 2, overflow: 'hidden' }}>
                          <View style={{ height: 3, width: `${pct}%` as any, backgroundColor: '#000000', borderRadius: 2 }} />
                        </View>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary, marginTop: 3 }}>
                          {left > 0 ? `${left} of ${event.max_participants} spots left` : 'Sold out'}
                        </Text>
                      </View>
                      <View>
                        <View style={{
                          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                          backgroundColor: event.entry_fee === 0 ? '#000000' : '#F0F0F0',
                        }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: event.entry_fee === 0 ? '#FFFFFF' : THEME.text }}>
                            {event.entry_fee === 0 ? 'FREE' : formatCurrency(event.entry_fee)}
                          </Text>
                        </View>
                        {event.prize_pool > 0 && (
                          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: THEME.textTertiary, textAlign: 'center', marginTop: 2 }}>
                            🏆 {formatCurrency(event.prize_pool)} prize
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            )
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}
