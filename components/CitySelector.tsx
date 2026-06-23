import { View, Text, Pressable, Modal, ScrollView } from 'react-native'
import { MapPin, Check, X, ChevronDown } from 'lucide-react-native'
import { useState } from 'react'
import { useUiStore, CITIES } from '../stores/uiStore'
import { THEME } from '../lib/utils'

// Playo-style location picker. Tap the pill → choose a city. Updates the
// shared uiStore.city which Home/Discover use to filter events.
export default function CitySelector({ compact }: { compact?: boolean }) {
  const city = useUiStore((s) => s.city)
  const setCity = useUiStore((s) => s.setCity)
  const [open, setOpen] = useState(false)

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: compact ? 8 : 10, height: 34, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: THEME.border }}
      >
        <MapPin size={14} color={THEME.text} strokeWidth={2.2} />
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 12.5, color: THEME.text, maxWidth: 96 }}>{city}</Text>
        <ChevronDown size={13} color={THEME.textTertiary} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable onPress={(e) => e.stopPropagation?.()} style={{ backgroundColor: THEME.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 }}>
              <Text style={{ flex: 1, fontFamily: 'Inter_900Black', fontSize: 18, color: THEME.text }}>Choose your city</Text>
              <Pressable onPress={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={THEME.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CITIES.map((c) => {
                const sel = c === city
                return (
                  <Pressable key={c} onPress={() => { setCity(c); setOpen(false) }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 15, backgroundColor: sel ? '#F4F4F5' : 'transparent' }}>
                    <MapPin size={17} color={sel ? THEME.text : THEME.textTertiary} />
                    <Text style={{ flex: 1, fontFamily: sel ? 'Inter_700Bold' : 'Inter_500Medium', fontSize: 15, color: THEME.text }}>{c}</Text>
                    {sel && <Check size={18} color={THEME.text} />}
                  </Pressable>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

// Helper used by screens: does this event match the selected city?
export function matchesCity(eventCity: string | undefined, selected: string): boolean {
  if (selected === 'All India') return true
  if (!eventCity) return false
  return eventCity.toLowerCase().includes(selected.toLowerCase())
}
