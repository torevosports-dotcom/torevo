import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'

export default function OTPScreen() {
  const router = useRouter()
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const verifyOTP = useAuthStore((s) => s.verifyOTP)
  const signInWithPhone = useAuthStore((s) => s.signInWithPhone)
  const loading = useAuthStore((s) => s.loading)

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputs = useRef<(TextInput | null)[]>([])

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[idx] = digit
    setOtp(newOtp)
    if (digit && idx < 5) inputs.current[idx + 1]?.focus()
    if (!digit && idx > 0) inputs.current[idx - 1]?.focus()
  }

  const handleVerify = async () => {
    const token = otp.join('')
    if (token.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits.')
      return
    }
    const { error, isNewUser } = await verifyOTP(phone!, token)
    if (error) {
      Alert.alert('Verification Failed', error)
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
      return
    }
    if (isNewUser) {
      router.replace('/(auth)/setup' as any)
    } else {
      router.replace('/(tabs)/' as any)
    }
  }

  const handleResend = async () => {
    const { error } = await signInWithPhone(phone!)
    if (error) Alert.alert('Error', error)
    else Alert.alert('OTP Sent', 'A new OTP has been sent to your number.')
  }

  const otpComplete = otp.every((d) => d !== '')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.push('/(auth)/login')}
              style={{ marginBottom: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 18 }}>←</Text>
            </Pressable>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#09090B', marginBottom: 6 }}>Enter OTP</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', marginBottom: 32 }}>
              Sent to +91 {phone?.replace(/(\d{5})(\d{5})/, '$1 $2')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).springify()} style={{ flexDirection: 'row', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r }}
                value={digit}
                onChangeText={(v) => handleChange(v, i)}
                keyboardType="number-pad"
                maxLength={1}
                style={{
                  width: 48, height: 56, borderRadius: 14,
                  borderWidth: 2,
                  borderColor: digit ? '#09090B' : '#E4E4E7',
                  textAlign: 'center',
                  fontFamily: 'Inter_700Bold', fontSize: 22, color: '#09090B',
                }}
                autoFocus={i === 0}
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Pressable
              onPress={handleVerify}
              disabled={loading || !otpComplete}
              style={{
                backgroundColor: otpComplete ? '#09090B' : '#E4E4E7',
                paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginBottom: 16,
              }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: otpComplete ? 'white' : '#A1A1AA' }}>
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </Text>
            </Pressable>

            <Pressable onPress={handleResend} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A1A1AA' }}>
                Didn't receive? <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#09090B' }}>Resend OTP</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
