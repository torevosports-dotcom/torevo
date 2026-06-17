import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { mapProfile } from '../../lib/mappers'

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const ready = phone.replace(/\D/g, '').length >= 10

  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.')
      return
    }
    setLoading(true)
    const formatted = `+91${digits}`

    // Phone-OTP is disabled for now. Instead we open a REAL Supabase session
    // anonymously so every write gets a genuine auth.uid() (needed for RLS,
    // foreign keys, and the register_for_event RPC). No SMS required.
    try {
      const { data, error } = await (supabase.auth as any).signInAnonymously()
      if (!error && data?.session && data?.user) {
        const uid = data.user.id
        const uname = 'u' + uid.replace(/-/g, '').slice(0, 12)
        // Ensure a profile row exists so we skip the setup gate entirely (no OTP, no onboarding wall).
        await supabase.from('profiles').upsert({
          id: uid, name: 'Torevo User', username: uname, phone: formatted, city: 'India', wallet_balance: 500,
        })
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single()
        useAuthStore.setState({
          session: data.session as any,
          user: profile ? mapProfile(profile as any) : ({
            id: uid, name: 'Torevo User', username: uname, email: '', phone: formatted, city: 'India', bio: '',
            wallet_balance: 500, sports_interests: [], events_participated: 0, events_won: 0,
            total_winnings: 0, verification_status: 'unverified',
          } as any),
          initialized: true,
        })
        setLoading(false)
        return
      }
    } catch {
      // fall through to local session
    }

    // Fallback (anonymous auth not enabled in the dashboard): local-only session.
    // The UI works but writes won't persist to Supabase.
    useAuthStore.setState({
      session: { user: { id: `u_${digits}`, phone: formatted } } as any,
      user: {
        id: `u_${digits}`,
        name: 'Torevo User',
        username: `user${digits.slice(-4)}`,
        email: '',
        phone: formatted,
        city: 'India',
        bio: '',
        avatar_url: null,
        wallet_balance: 0,
        sports_interests: [] as any,
        events_participated: 0,
        events_won: 0,
        total_winnings: 0,
        verification_status: 'unverified' as const,
      } as any,
    })
    setLoading(false)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>

          <Animated.View entering={FadeInDown.delay(0).springify()}>
            {/* Logo */}
            <Image source={require('../../assets/logo.png')} style={{ width: 180, height: 54, marginBottom: 24 }} resizeMode="contain" />
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 30, color: '#0A0A0A', marginBottom: 8 }}>Welcome to Torevo</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#6B7280', marginBottom: 36, lineHeight: 24 }}>
              India's sports platform — find events, build teams, win prizes. Escrow-backed payments.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#9A9A9A', marginBottom: 8, letterSpacing: 0.5 }}>
              MOBILE NUMBER
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1.5,
              borderColor: phone.length > 0 ? '#000000' : '#E8E8E8',
              borderRadius: 16, paddingHorizontal: 16, height: 56,
              backgroundColor: '#F8F8F8',
            }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0A0A0A', marginRight: 10 }}>+91</Text>
              <View style={{ width: 1, height: 20, backgroundColor: '#E8E8E8', marginRight: 12 }} />
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                placeholder="XXXXX XXXXX"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 17, color: '#0A0A0A', letterSpacing: 2 }}
              />
            </View>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
              No OTP needed — just tap Continue to get started.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).springify()} style={{ marginTop: 28 }}>
            <Pressable
              onPress={handleSendOTP}
              disabled={loading || !ready}
              style={{
                backgroundColor: ready ? '#000000' : '#F0F0F0',
                paddingVertical: 18, borderRadius: 16, alignItems: 'center',
              }}
            >
              <Text style={{
                fontFamily: 'Inter_700Bold', fontSize: 16,
                color: ready ? '#FFFFFF' : '#9CA3AF',
              }}>
                {loading ? 'Signing in...' : 'Continue →'}
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).springify()} style={{ marginTop: 28, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 }}>
              By continuing, you agree to Torevo's Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
