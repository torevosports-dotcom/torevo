import { ScrollView, View, Text, TextInput, Pressable, Alert, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search, Ticket, X, Shield, ChevronRight } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { useEventStore } from '../../stores/eventStore'
import { useAuthStore } from '../../stores/authStore'
import { categoryMeta, formatCurrency, THEME } from '../../lib/utils'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  upcoming:  { label: 'Upcoming',  bg: THEME.orangeLight, text: THEME.orangeDark,  icon: '⏳' },
  live:      { label: 'Live',      bg: '#000',            text: '#fff',             icon: '●'  },
  completed: { label: 'Completed', bg: THEME.greenBg,     text: THEME.green,        icon: '✅' },
  cancelled: { label: 'Cancelled', bg: THEME.redBg,       text: THEME.red,          icon: '✕'  },
}

type FilterKey = 'all' | 'upcoming' | 'completed'

export default function TicketsScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { tickets, cancelTicket, fetchTickets } = useEventStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    if (user?.id) fetchTickets(user.id)
  }, [user?.id])

  const filtered = tickets.filter((t) => {
    const matchQ = !query || t.event.title.toLowerCase().includes(query.toLowerCase())
    const matchF = filter === 'all' || t.status === filter
    return matchQ && matchF
  })

  const upcomingCount = tickets.filter(t => t.status === 'upcoming').length
  const totalSpent = tickets.reduce((sum, t) => sum + t.amount_paid, 0)

  const handleCancel = (ticketId: string, eventTitle: string) => {
    if (!user?.id) return
    Alert.alert(
      'Cancel Registration',
      `Cancel your registration for "${eventTitle}"?\n\nRefund will be processed per the event's refund policy.`,
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => cancelTicket(ticketId, user.id) },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: THEME.card, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: THEME.border }}>
        <Pressable onPress={() => router.navigate('/' as any)} style={{ marginBottom: 12 }}>
          <Image source={require('../../assets/logo_h.png')} style={{ width: 104, height: 30 }} resizeMode="contain" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22, color: THEME.text, marginBottom: 14 }}>My Tickets</Text>

        {/* Stats strip */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Upcoming',    value: String(upcomingCount), accent: true },
            { label: 'Total',       value: String(tickets.length), accent: false },
            { label: 'Total Spent', value: totalSpent > 0 ? formatCurrency(totalSpent) : 'Free', accent: false },
          ].map(({ label, value, accent }) => (
            <View key={label} style={{
              flex: 1, borderRadius: 14, padding: 12,
              backgroundColor: accent ? THEME.orangeBg : '#F3F4F6',
              borderWidth: 1.5, borderColor: accent ? THEME.orangeLight : THEME.border,
            }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: accent ? THEME.orangeDark : THEME.text }}>{value}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: THEME.textTertiary, marginTop: 2 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: THEME.bg, borderRadius: 14,
          paddingHorizontal: 12, height: 46,
          borderWidth: 1.5, borderColor: query.length > 0 ? THEME.orange : THEME.border,
          marginBottom: 12,
        }}>
          <Search size={16} color={query.length > 0 ? THEME.orange : THEME.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your events..."
            placeholderTextColor={THEME.textTertiary}
            style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: THEME.text }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <X size={14} color={THEME.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Filter tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['all', 'upcoming', 'completed'] as FilterKey[]).map(f => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: filter === f ? THEME.orange : '#F3F4F6',
                borderWidth: 1, borderColor: filter === f ? THEME.orange : THEME.border,
              }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: filter === f ? 'white' : THEME.textSecondary }}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'upcoming' && upcomingCount > 0 ? ` (${upcomingCount})` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Ticket list */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 14 }}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎫</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: THEME.text, textAlign: 'center' }}>
              No events found
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.textTertiary, textAlign: 'center', marginTop: 6 }}>
              Register for events to see them here
            </Text>
            <Pressable
              onPress={() => router.navigate('/discover' as any)}
              style={{ marginTop: 20, backgroundColor: THEME.orange, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: 'white' }}>Browse Events</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((ticket, i) => {
            const meta = categoryMeta[ticket.event.category]
            // Live state comes from the EVENT (single source of truth), not the ticket.
            const isLive = ticket.event.status === 'live' && ticket.status !== 'cancelled'
            const isDone = ticket.status !== 'cancelled' && (ticket.event.status === 'completed' || ticket.status === 'completed')
            const cfg = isLive ? STATUS_CONFIG.live : (STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.upcoming)
            // Live/finished events deep-link to the scoreboard; upcoming → event details.
            const target = (isLive || isDone) ? `/match/${ticket.event.id}` : `/events/${ticket.event.id}`

            return (
              <Animated.View key={ticket.id} entering={FadeInDown.delay(Math.min(i, 8) * 60).springify()}>
                <Pressable
                  onPress={() => router.push(target as any)}
                  style={{
                    marginHorizontal: 16, marginBottom: 14,
                    borderRadius: 16, overflow: 'hidden',
                    backgroundColor: THEME.card,
                    borderWidth: 1, borderColor: THEME.border,
                  }}
                >
                  {/* Sport color banner (compact) */}
                  <View style={{ height: 80, backgroundColor: meta.bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 14, position: 'relative' }}>
                    <Text style={{ fontSize: 44 }}>{meta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: THEME.text }} numberOfLines={1}>
                        {ticket.event.title}
                      </Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: THEME.textSecondary, marginTop: 2 }}>
                        {meta.label} · {ticket.event.event_type}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: cfg.bg }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: cfg.text }}>{cfg.icon} {cfg.label}</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary, marginBottom: 2 }}>Date & Time</Text>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: THEME.text }}>
                          {ticket.event.date} · {ticket.event.time}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary, marginBottom: 2 }}>Venue</Text>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: THEME.text }} numberOfLines={1}>
                          {ticket.event.location.venue_name}
                        </Text>
                      </View>
                    </View>

                    {ticket.team_name && (
                      <View style={{ backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 12 }}>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: THEME.textSecondary }}>
                          🏅 Team: {ticket.team_name}
                        </Text>
                      </View>
                    )}

                    {/* Live / result CTA */}
                    {(isLive || isDone) && (
                      <Pressable
                        onPress={(e) => { e.stopPropagation?.(); router.push(`/match/${ticket.event.id}` as any) }}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                          paddingVertical: 11, borderRadius: 12, marginBottom: 12,
                          backgroundColor: isLive ? '#000' : THEME.card,
                          borderWidth: isLive ? 0 : 1.5, borderColor: THEME.border,
                        }}
                      >
                        {isLive && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }} />}
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: isLive ? '#fff' : THEME.text }}>
                          {isLive ? 'Watch Live' : 'View Result'}
                        </Text>
                      </Pressable>
                    )}

                    {/* Footer */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ticket size={12} color={THEME.textTertiary} />
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>
                          {ticket.ticket_number}
                        </Text>
                        {ticket.event.escrow_protected && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 }}>
                            <Shield size={10} color={THEME.orange} />
                            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: THEME.orange }}>Escrow</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: ticket.amount_paid === 0 ? THEME.greenBg : THEME.orangeBg }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: ticket.amount_paid === 0 ? THEME.green : THEME.orangeDark }}>
                            {ticket.amount_paid === 0 ? 'FREE' : formatCurrency(ticket.amount_paid)}
                          </Text>
                        </View>
                        {ticket.status === 'upcoming' && (
                          <Pressable
                            onPress={e => { e.stopPropagation?.(); handleCancel(ticket.id, ticket.event.title) }}
                            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: THEME.card }}
                          >
                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: THEME.textSecondary }}>Cancel</Text>
                          </Pressable>
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
