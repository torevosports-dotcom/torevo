import { Tabs, useRouter } from 'expo-router'
import { View, Text, Pressable, Platform } from 'react-native'
import { Home, Compass, Ticket, User, Plus, Trophy, Radio, Repeat } from 'lucide-react-native'
import { useEffect } from 'react'
import { useUiStore } from '../../stores/uiStore'

const ACTIVE = '#000000'
const INACTIVE = '#C0C0C0'

function TabItem({ focused, icon: Icon, label, accent, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingTop: 9, paddingBottom: 6 }}>
      {accent ? (
        <View style={{
          width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginTop: -4,
          ...(Platform.OS === 'web' ? ({ boxShadow: '0 2px 10px rgba(0,0,0,0.22)' } as any)
            : { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }),
        }}>
          <Icon size={20} color="#fff" strokeWidth={2.5} />
        </View>
      ) : (
        <Icon size={23} color={focused ? ACTIVE : INACTIVE} strokeWidth={focused ? 2.4 : 1.7} />
      )}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
        style={{ fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_400Regular', fontSize: 9, color: focused ? ACTIVE : INACTIVE, marginTop: 3, width: '100%', textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  )
}

// Circular flipper — one tap flips between the Play side and the Host side.
function CenterToggle({ navigation }: any) {
  const mode = useUiStore((s) => s.mode)
  const setMode = useUiStore((s) => s.setMode)
  const host = mode === 'host'
  const flip = () => {
    const next = host ? 'participant' : 'host'
    setMode(next)
    navigation.navigate(next === 'host' ? 'manage' : 'index')
  }
  return (
    <View style={{ width: 84, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable onPress={flip} style={{
        width: 54, height: 54, borderRadius: 27, marginTop: -14,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: host ? '#000000' : '#FFFFFF',
        borderWidth: host ? 0 : 2, borderColor: '#000000',
        ...(Platform.OS === 'web' ? ({ boxShadow: '0 3px 12px rgba(0,0,0,0.25)' } as any)
          : { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 }),
      }}>
        <Repeat size={15} color={host ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)'} style={{ position: 'absolute', top: 8 }} />
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 11, color: host ? '#FFFFFF' : '#000000', marginTop: 6 }}>
          {host ? 'HOST' : 'PLAY'}
        </Text>
      </Pressable>
    </View>
  )
}

function TabBar({ state, navigation }: any) {
  const router = useRouter()
  const mode = useUiStore((s) => s.mode)
  const setMode = useUiStore((s) => s.setMode)
  const current = state.routes[state.index]?.name

  // Keep mode in sync with the visible screen so the footer never mismatches
  // (e.g. landing on My Events should show the host footer). 'live'/'profile'
  // are neutral — viewing them shouldn't flip the user's mode.
  useEffect(() => {
    if (current === 'manage' && mode !== 'host') setMode('host')
    else if ((current === 'index' || current === 'discover' || current === 'tickets') && mode !== 'participant') setMode('participant')
  }, [current])

  const PLAY = [
    { key: 'discover', label: 'Events', icon: Compass },
    { key: 'tickets', label: 'Tickets', icon: Ticket },
  ]
  const HOST = [
    { key: '__create', label: 'Create', icon: Plus, action: () => router.push('/create-event') },
    { key: 'live', label: 'Live', icon: Radio },
  ]
  const items = mode === 'host' ? HOST : PLAY
  const left = [items[0]]
  const right = [items[1]]
  const render = (it: any) => (
    <TabItem key={it.key} focused={current === it.key} icon={it.icon} label={it.label} accent={it.accent}
      onPress={() => (it.action ? it.action() : navigation.navigate(it.key))} />
  )

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
      borderTopWidth: 1, borderTopColor: '#F0F0F0',
      height: Platform.OS === 'ios' ? 84 : 64, paddingBottom: Platform.OS === 'ios' ? 20 : 4,
      ...(Platform.OS === 'web' ? ({ boxShadow: '0 -1px 0 #F0F0F0, 0 -8px 24px rgba(0,0,0,0.06)' } as any)
        : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 8 }),
    }}>
      {left.map(render)}
      <CenterToggle navigation={navigation} />
      {right.map(render)}
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="host" options={{ href: null }} />
    </Tabs>
  )
}
