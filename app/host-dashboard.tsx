import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Radio, Users, Plus, Trophy, UserCheck } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useEventStore } from '../stores/eventStore'
import { useUiStore } from '../stores/uiStore'
import { formatCurrency, categoryMeta, statusMeta, THEME } from '../lib/utils'

export default function HostDashboard() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const hostedEvents = useEventStore(s => s.hostedEvents)
  const umpiringEvents = useEventStore(s => s.umpiringEvents)
  const fetchHostedEvents = useEventStore(s => s.fetchHostedEvents)
  const fetchUmpiringEvents = useEventStore(s => s.fetchUmpiringEvents)
  const assignUmpire = useEventStore(s => s.assignUmpire)
  const setMode = useUiStore(s => s.setMode)
  const [loading, setLoading] = useState(true)
  const [openAssign, setOpenAssign] = useState<string | null>(null)
  const [phone, setPhone] = useState('')

  const refresh = async () => {
    if (!user?.id) return
    await Promise.all([fetchHostedEvents(user.id), fetchUmpiringEvents(user.id)])
  }
  useEffect(() => { setLoading(true); refresh().finally(() => setLoading(false)) }, [user?.id])

  const scoreRoute = (e: any) => (e.category === 'cricket' ? `/scorer/cricket/${e.id}` : `/scorer/${e.id}`)

  async function onAssign(eventId: string) {
    const res = await assignUmpire(eventId, phone)
    setOpenAssign(null); setPhone('')
    await refresh()
    Alert.alert('Umpire assigned', res.linked
      ? 'Linked to their account — they can score now.'
      : 'Saved. They get scoring access the moment they sign up with this number.')
  }

  const scoreBtn = (e: any) => (
    <Pressable onPress={() => router.push(scoreRoute(e) as any)}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 12, backgroundColor: '#000' }}>
      <Radio size={15} color="#fff" />
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>Score Live</Text>
    </Pressable>
  )

  const card = (e: any, i: number, opts: { showUmpire: boolean }) => {
    const meta = categoryMeta[e.category as keyof typeof categoryMeta] ?? categoryMeta.other
    const st = statusMeta[e.status as keyof typeof statusMeta] ?? statusMeta.upcoming
    return (
      <Animated.View key={e.id} entering={FadeInDown.delay(i * 50).springify()}>
        <View style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: THEME.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text }}>{e.title}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>{e.date} · {e.location?.city}</Text>
            </View>
            <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, backgroundColor: st.bg }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: st.text }}>{st.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Users size={14} color={THEME.textSecondary} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.text }}>{e.current_participants}/{e.max_participants}</Text>
            </View>
            {e.prize_pool > 0 && <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.textSecondary }}>🏆 {formatCurrency(e.prize_pool)}</Text>}
          </View>

          {scoreBtn(e)}

          {opts.showUmpire && (
            <>
              <Pressable
                onPress={() => { setOpenAssign(openAssign === e.id ? null : e.id); setPhone(e.umpire_phone ?? '') }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }}
              >
                <UserCheck size={15} color={THEME.textSecondary} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: THEME.textSecondary }}>
                  {e.umpire_phone ? `Umpire: ${e.umpire_phone}` : 'Assign umpire'}
                </Text>
              </Pressable>
              {openAssign === e.id && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TextInput value={phone} onChangeText={setPhone} placeholder="Umpire mobile number" keyboardType="phone-pad"
                    placeholderTextColor={THEME.textTertiary}
                    style={{ flex: 1, backgroundColor: '#F4F4F4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontFamily: 'Inter_500Medium', fontSize: 13, color: THEME.text }} />
                  <Pressable onPress={() => onAssign(e.id)} style={{ paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>Save</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </Animated.View>
    )
  }

  const sectionHead = (t: string) => (
    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.textSecondary, marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t}</Text>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
        {router.canGoBack() && (
          <Pressable onPress={() => { setMode('participant'); router.back() }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={18} color={THEME.text} />
          </Pressable>
        )}
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: THEME.text, flex: 1 }}>Host Dashboard</Text>
        <Pressable onPress={() => router.push('/create-event')} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#000' }}>
          <Plus size={15} color="#fff" strokeWidth={2.5} /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>New</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={THEME.text} /></View>
      ) : (hostedEvents.length === 0 && umpiringEvents.length === 0) ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Trophy size={40} color={THEME.textTertiary} strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: THEME.text, marginTop: 12 }}>No events yet</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.textTertiary, textAlign: 'center', marginTop: 4 }}>Create an event to start hosting and scoring matches.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          {umpiringEvents.length > 0 && (
            <>
              {sectionHead('Matches you umpire')}
              {umpiringEvents.map((e: any, i: number) => card(e, i, { showUmpire: false }))}
            </>
          )}
          {hostedEvents.length > 0 && (
            <>
              {sectionHead('Your events')}
              {hostedEvents.map((e: any, i: number) => card(e, i, { showUmpire: true }))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
