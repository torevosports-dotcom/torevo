import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native'
import { toast } from '../../stores/toastStore'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useEventStore } from '../../stores/eventStore'
import { THEME } from '../../lib/utils'

export default function TeamRoster() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>() // eventId
  const user = useAuthStore((s) => s.user)
  const { getMyTicketForEvent, fetchTeamMembers, saveTeamMembers } = useEventStore()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [members, setMembers] = useState<{ name: string; phone: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return }
      const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(ev)
      const t = await getMyTicketForEvent(id, user.id)
      if (t) {
        setTicketId(t.id)
        const existing = await fetchTeamMembers(t.id)
        const size = ev?.team_size || ev?.team_size_max || existing.length || 2
        setMembers(Array.from({ length: Math.max(size, existing.length) }, (_, i) =>
          existing[i] ? { name: existing[i].name, phone: existing[i].phone ?? '' } : { name: '', phone: '' }))
      }
      setLoading(false)
    })()
  }, [id, user?.id])

  const ended = event && ['completed', 'cancelled'].includes(event.status)

  async function save() {
    if (!ticketId) return
    setSaving(true)
    try { await saveTeamMembers(ticketId, members); toast('Team roster updated.', 'success') }
    catch (e: any) { toast(e?.message ?? 'Could not save. Try again.', 'error') }
    finally { setSaving(false) }
  }

  const Header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
      <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={18} color={THEME.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: THEME.text }}>Team Roster</Text>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>{event?.title}</Text>
      </View>
    </View>
  )

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={THEME.text} /></SafeAreaView>
  if (!ticketId) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>{Header}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: THEME.textSecondary, textAlign: 'center' }}>You haven't registered a team for this event yet.</Text>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>{Header}
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {ended && (
          <View style={{ backgroundColor: '#F0F0F0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.textSecondary }}>This event has ended — the roster is now locked.</Text>
          </View>
        )}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.text, marginBottom: 2 }}>Players ({members.length})</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary, marginBottom: 12 }}>
          Each player's stats track to their mobile number.
        </Text>
        {members.map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput value={m.name} editable={!ended}
              onChangeText={(t) => setMembers((ms) => ms.map((x, j) => j === i ? { ...x, name: t } : x))}
              placeholder={i === 0 ? 'You' : `Player ${i + 1}`} placeholderTextColor={THEME.textTertiary}
              style={{ flex: 1.2, backgroundColor: '#fff', borderWidth: 1, borderColor: THEME.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.text }} />
            <TextInput value={m.phone} editable={!ended} keyboardType="phone-pad"
              onChangeText={(t) => setMembers((ms) => ms.map((x, j) => j === i ? { ...x, phone: t } : x))}
              placeholder="Mobile" placeholderTextColor={THEME.textTertiary}
              style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: THEME.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.text }} />
          </View>
        ))}
        {!ended && (
          <Pressable onPress={save} disabled={saving} style={{ marginTop: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', opacity: saving ? 0.6 : 1 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' }}>{saving ? 'Saving…' : 'Save Roster'}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
