import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { categoryMeta } from '../../lib/utils'
import type { EventCategory } from '../../lib/types'

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh']

const SPORTS: EventCategory[] = ['cricket', 'football', 'basketball', 'badminton', 'kabaddi', 'volleyball', 'tennis', 'table_tennis', 'pickleball', 'esports']

export default function SetupScreen() {
  const router = useRouter()
  const createProfile = useAuthStore((s) => s.createProfile)
  const loading = useAuthStore((s) => s.loading)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [sports, setSports] = useState<EventCategory[]>([])

  const toggleSport = (s: EventCategory) => {
    setSports((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  const handleCreate = async () => {
    if (!name.trim() || !username.trim() || !city) {
      Alert.alert('Missing Info', 'Please fill in your name, username, and city.')
      return
    }
    if (sports.length === 0) {
      Alert.alert('Pick Sports', 'Select at least one sport you play or follow.')
      return
    }
    const { error } = await createProfile({ name: name.trim(), username, city, sports })
    if (error) {
      Alert.alert('Error', error)
      return
    }
    router.replace('/(tabs)/' as any)
  }

  const canProceed = name.trim().length > 1 && username.trim().length > 2 && city && sports.length > 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#09090B', marginBottom: 4 }}>Set up your profile</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', marginBottom: 28 }}>
            Just a few details to get you started. You'll get ₹500 welcome bonus in your wallet!
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify()}>
          {[
            { label: 'Full Name *', value: name, set: setName, placeholder: 'e.g. Rahul Sharma', autoCapitalize: 'words' as const },
            { label: 'Username *', value: username, set: (v: string) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, '')), placeholder: 'e.g. rahul_plays', autoCapitalize: 'none' as const },
          ].map(({ label, value, set, placeholder, autoCapitalize }) => (
            <View key={label} style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>{label}</Text>
              <TextInput
                value={value}
                onChangeText={set}
                placeholder={placeholder}
                placeholderTextColor="#A1A1AA"
                autoCapitalize={autoCapitalize}
                style={{
                  borderWidth: 1.5, borderColor: value.length > 0 ? '#09090B' : '#E4E4E7',
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B',
                }}
              />
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 10 }}>Your City *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CITIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCity(c)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: city === c ? '#09090B' : '#F4F4F5',
                  borderWidth: 1, borderColor: city === c ? '#09090B' : '#E4E4E7',
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: city === c ? 'white' : '#52525B' }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()} style={{ marginBottom: 32 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 4 }}>Sports You Play</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#A1A1AA', marginBottom: 10 }}>Pick all that apply</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SPORTS.map((s) => {
              const meta = categoryMeta[s]
              const selected = sports.includes(s)
              return (
                <Pressable
                  key={s}
                  onPress={() => toggleSport(s)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: selected ? '#09090B' : '#F4F4F5',
                    borderWidth: 1, borderColor: selected ? '#09090B' : '#E4E4E7',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{meta.emoji}</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: selected ? 'white' : '#52525B' }}>{meta.label}</Text>
                </Pressable>
              )
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <View style={{ backgroundColor: '#F4F4F5', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E4E4E7' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#09090B' }}>🎁 Welcome Bonus</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#71717A', marginTop: 4 }}>
              ₹500 will be credited to your Torevo wallet on sign-up. Use it to register for events!
            </Text>
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={loading || !canProceed}
            style={{
              backgroundColor: canProceed ? '#09090B' : '#E4E4E7',
              paddingVertical: 16, borderRadius: 18, alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: canProceed ? 'white' : '#A1A1AA' }}>
              {loading ? 'Creating profile...' : 'Start Playing →'}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
