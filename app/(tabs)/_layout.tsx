import { Tabs } from 'expo-router'
import { View, Text, Pressable, Platform } from 'react-native'
import { Home, Compass, Ticket, User, Plus } from 'lucide-react-native'
import { useRouter } from 'expo-router'

// ─── Uber-style tab icon ──────────────────────────────────────────────────────
// Active  → solid black icon + bold black label + 2.5px top indicator
// Inactive → light gray icon + regular gray label
function TabIcon({
  focused,
  icon: Icon,
  label,
}: {
  focused: boolean
  icon: any
  label: string
}) {
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      {/* Top indicator bar */}
      <View
        style={{
          position: 'absolute',
          top: -8,
          width: 28,
          height: 2.5,
          borderRadius: 2,
          backgroundColor: focused ? '#000000' : 'transparent',
        }}
      />

      <Icon
        size={23}
        color={focused ? '#000000' : '#C0C0C0'}
        strokeWidth={focused ? 2.4 : 1.7}
        style={{ marginTop: 2 }}
      />

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={{
          fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_400Regular',
          fontSize: 9,
          color: focused ? '#000000' : '#C0C0C0',
          marginTop: 3,
          letterSpacing: 0,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export default function TabLayout() {
  const router = useRouter()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: Platform.OS === 'ios' ? 68 : 62,
          paddingBottom: Platform.OS === 'ios' ? 0 : 2,
          paddingTop: 0,
          ...(Platform.OS === 'web'
            ? ({
                boxShadow: '0 -1px 0 #F0F0F0, 0 -8px 24px rgba(0,0,0,0.06)',
              } as any)
            : {
                shadowColor: '#000000',
                shadowOpacity: 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: -3 },
                elevation: 8,
              }),
        },
        tabBarItemStyle: {
          paddingTop: 10,
          paddingBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={Home} label="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={Compass} label="Events" />
          ),
        }}
      />

      {/* Create — inline black circle, no float */}
      <Tabs.Screen
        name="host"
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => (
            <Pressable
              onPress={() => router.push('/create-event')}
              style={{ alignItems: 'center' }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#000000',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -4,
                  ...(Platform.OS === 'web'
                    ? ({
                        boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
                      } as any)
                    : {
                        shadowColor: '#000',
                        shadowOpacity: 0.22,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4,
                      }),
                }}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 9,
                  color: focused ? '#000000' : '#C0C0C0',
                  marginTop: 3,
                  letterSpacing: 0,
                  textAlign: 'center',
                }}
              >
                Create
              </Text>
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={Ticket} label="Tickets" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={User} label="Profile" />
          ),
        }}
      />
    </Tabs>
  )
}
