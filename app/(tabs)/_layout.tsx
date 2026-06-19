import { Tabs, useRouter } from 'expo-router'
import { View, Text, Pressable, Platform } from 'react-native'
import { Home, Compass, Ticket, User, Plus, Trophy, Radio } from 'lucide-react-native'
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

function CenterToggle({ navigation }: any) {
  const mode = useUiStore((s) => s.mode)
  const setMode = useUiStore((s) => s.setMode)
  return (
    <View style={{ width: 92, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 16, padding: 3 }}>
        {([['participant', 'Play'], ['host', 'Host']] as const).map(([m, label]) => (
          <Pressable key={m}
            onPress={() => { setMode(m as any); navigation.navigate(m === 'host' ? 'manage' : 'index') }}
            style={{ paddingHorizontal: 10, height: 28, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === m ? '#000' : 'transparent' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: mode === m ? '#fff' : '#71717A' }}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function TabBar({ state, navigation }: any) {
  const router = useRouter()
  const mode = useUiStore((s) => s.mode)
  const current = state.routes[state.index]?.name

  const PLAY = [
    { key: 'index', label: 'Home', icon: Home },
    { key: 'discover', label: 'Events', icon: Compass },
    { key: 'tickets', label: 'Tickets', icon: Ticket },
    { key: 'profile', label: 'Profile', icon: User },
  ]
  const HOST = [
    { key: 'manage', label: 'My Events', icon: Trophy },
    { key: '__create', label: 'Create', icon: Plus, accent: true, action: () => router.push('/create-event') },
    { key: 'live', label: 'Live', icon: Radio },
    { key: 'profile', label: 'Profile', icon: User },
  ]
  const items = mode === 'host' ? HOST : PLAY
  const left = items.slice(0, 2)
  const right = items.slice(2)
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
