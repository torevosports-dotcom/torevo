import { View, Text, TextInput, Pressable, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search, X, ChevronLeft } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useEventStore } from '../stores/eventStore'
import { categoryMeta, statusMeta, formatCurrency } from '../lib/utils'

export default function SearchScreen() {
  const router = useRouter()
  const events = useEventStore((s) => s.events)
  const [query, setQuery] = useState('')

  const results = query.length > 1
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.location.city.toLowerCase().includes(query.toLowerCase()) ||
          e.category.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Search bar header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color="#09090B" />
        </Pressable>
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: '#F4F4F5', borderRadius: 14,
          paddingHorizontal: 12, height: 44,
          borderWidth: 1, borderColor: '#E4E4E7',
        }}>
          <Search size={15} color="#A1A1AA" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Events, sports, cities..."
            placeholderTextColor="#A1A1AA"
            autoFocus
            style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B' }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <X size={14} color="#A1A1AA" />
            </Pressable>
          )}
        </View>
      </View>

      {query.length <= 1 ? (
        <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#09090B', marginTop: 12 }}>Start typing to search</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A1A1AA', marginTop: 6, textAlign: 'center' }}>
            Search by sport, event name, or city
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48 }}>😕</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#09090B', marginTop: 12 }}>No results for "{query}"</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A1A1AA', marginTop: 6, textAlign: 'center' }}>Try different keywords</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#A1A1AA' }}>{results.length} results</Text>
            </View>
          }
          renderItem={({ item: event, index }) => {
            const meta = categoryMeta[event.category]
            const status = statusMeta[event.status]
            return (
              <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <Pressable
                  onPress={() => router.push(`/events/${event.id}` as any)}
                  style={{
                    marginHorizontal: 16, marginBottom: 10,
                    borderRadius: 16, overflow: 'hidden',
                    backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A',
                  }}
                >
                  <View style={{ height: 3, backgroundColor: '#3F3F46' }} />
                  <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: 'white' }} numberOfLines={1}>{event.title}</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#71717A', marginTop: 2 }}>
                        {event.location.venue_name} · {event.location.city}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: status.bg }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, color: status.text }}>{status.label}</Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'white' }}>
                        {event.entry_fee === 0 ? 'Free' : formatCurrency(event.entry_fee)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
