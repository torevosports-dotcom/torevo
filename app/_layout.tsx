import '../global.css'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts, Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '../stores/authStore'

const IS_DEMO = process.env.EXPO_PUBLIC_SUPABASE_URL === undefined ||
  process.env.EXPO_PUBLIC_SUPABASE_URL === '' ||
  process.env.EXPO_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

const DEMO_USER = {
  id: 'demo', name: 'Arjun Singh', username: 'arjun99', email: '',
  phone: '+911234567890', city: 'Mumbai', bio: 'Cricket & football enthusiast 🏏',
  avatar_url: null, wallet_balance: 1500,
  sports_interests: ['cricket', 'football', 'badminton'] as any,
  events_participated: 12, events_won: 4, total_winnings: 8500,
  verification_status: 'verified' as const, created_at: new Date().toISOString(),
}

if (Platform.OS === 'web') {
  ;(StyleSheet as any).setFlag?.('darkMode', 'class')
}

SplashScreen.preventAutoHideAsync()

function AuthGate() {
  const router = useRouter()
  const segments = useSegments()
  const { session, user, initialized } = useAuthStore()

  useEffect(() => {
    if (!initialized) return

    const inAuth = segments[0] === '(auth)'
    const inTabs = segments[0] === '(tabs)'

    if (!session && !inAuth) {
      router.replace('/(auth)/login' as any)
    } else if (session && !user && !inAuth) {
      router.replace('/(auth)/setup' as any)
    } else if (session && user && inAuth) {
      router.replace('/(tabs)/' as any)
    }
  }, [session, user, initialized, segments])

  return null
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  })
  const initialize = useAuthStore((s) => s.initialize)
  const initialized = useAuthStore((s) => s.initialized)

  useEffect(() => {
    if (IS_DEMO) {
      useAuthStore.setState({ initialized: true, session: { user: { id: 'demo' } } as any, user: DEMO_USER })
    } else {
      initialize()
    }
  }, [])

  useEffect(() => {
    if (fontsLoaded && initialized) SplashScreen.hideAsync()
  }, [fontsLoaded, initialized])

  if (!fontsLoaded || !initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#09090B" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="events/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="team/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="host-dashboard" options={{ presentation: 'card' }} />
        <Stack.Screen name="scorer/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="scorer/cricket/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="create-event" options={{ presentation: 'modal' }} />
        <Stack.Screen name="live" options={{ presentation: 'card' }} />
        <Stack.Screen name="find-team" options={{ presentation: 'card' }} />
        <Stack.Screen name="corporate" options={{ presentation: 'card' }} />
        <Stack.Screen name="prizes" options={{ presentation: 'card' }} />
        <Stack.Screen name="search" options={{ presentation: 'card' }} />
      </Stack>
    </SafeAreaProvider>
  )
}
