import { ScrollView, View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Shield, Trophy } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useEventStore } from '../stores/eventStore'
import { categoryMeta, formatCurrency, getRegistrationPercentage } from '../lib/utils'

export default function PrizesScreen() {
  const router = useRouter()
  const events = useEventStore((s) => s.events)
  const prizeEvents = events.filter((e) => e.prize_pool > 0).sort((a, b) => b.prize_pool - a.prize_pool)
  const totalPrizes = prizeEvents.reduce((sum, e) => sum + e.prize_pool, 0)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color="#09090B" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#09090B' }}>Prize Pools</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <View style={{ backgroundColor: '#09090B', borderRadius: 18, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Shield size={16} color="rgba(255,255,255,0.5)" />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>100% Escrow Protected</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 28, color: 'white' }}>{formatCurrency(totalPrizes)}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              in active prize pools · {prizeEvents.length} events
            </Text>
          </View>
        </Animated.View>

        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#09090B', marginBottom: 12 }}>
            Events with Prize Money
          </Text>
        </View>

        {prizeEvents.map((event, i) => {
          const meta = categoryMeta[event.category]
          const pct = getRegistrationPercentage(event.current_participants, event.max_participants)
          return (
            <Animated.View key={event.id} entering={FadeInDown.delay(i * 60 + 80).springify()}>
              <Pressable
                onPress={() => router.push(`/events/${event.id}` as any)}
                style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden', backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A' }}
              >
                <View style={{ height: 3, backgroundColor: '#3F3F46' }} />
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                        <Shield size={10} color="rgba(255,255,255,0.3)" />
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Escrow</Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: 'white' }}>{event.title}</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#52525B', marginTop: 3 }}>
                        {event.date} · {event.location.city}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Trophy size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: 'white' }}>
                          {formatCurrency(event.prize_pool)}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#71717A', marginTop: 2 }}>
                        Entry: {event.entry_fee === 0 ? 'Free' : formatCurrency(event.entry_fee)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 12, height: 4, backgroundColor: '#27272A', borderRadius: 2 }}>
                    <View style={{ height: 4, width: `${pct}%` as any, backgroundColor: pct > 80 ? 'white' : 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
                  </View>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#52525B', marginTop: 4 }}>
                    {event.current_participants}/{event.max_participants} registered
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          )
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}
