import { View, Text, Pressable, Platform } from 'react-native'
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native'
import { useEffect } from 'react'
import { useToast } from '../stores/toastStore'

// Branded global toast, mounted once at the app root.
export function Toast() {
  const { message, type, visible, hide } = useToast()

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(hide, 2800)
    return () => clearTimeout(t)
  }, [visible, message])

  if (!visible) return null

  const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle2 : Info
  const dot = type === 'error' ? '#F87171' : type === 'success' ? '#22C55E' : '#FFFFFF'

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(18)}
      exiting={FadeOutDown}
      style={{ position: 'absolute', left: 16, right: 16, bottom: 96, zIndex: 9999, alignItems: 'center' }}
    >
      <Pressable
        onPress={hide}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: '#0A0A0A', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, maxWidth: 520, width: '100%',
          ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 28px rgba(0,0,0,0.28)' } as any)
            : { shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 }),
        }}
      >
        <Icon size={18} color={dot} strokeWidth={2.2} />
        <Text style={{ flex: 1, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 }}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  )
}
