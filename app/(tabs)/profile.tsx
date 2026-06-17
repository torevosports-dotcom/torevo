import { ScrollView, View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CheckCircle2, Zap, Wallet, Settings, ChevronRight, Radio } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { useEventStore } from '../../stores/eventStore'
import { formatCurrency, categoryMeta, THEME } from '../../lib/utils'
import { computeCareer } from '../../lib/stats'

export default function ProfileScreen() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const tickets = useEventStore(s => s.tickets)
  const myScores = useEventStore(s => s.myScores)
  const fetchMyScores = useEventStore(s => s.fetchMyScores)
  const router = useRouter()

  useEffect(() => {
    if (user?.id) fetchMyScores(user.id)
  }, [user?.id])

  if (!user) return null

  // Real, deterministic profile derived from the user's actual activity.
  // XP/level are a transparent function of events played + won — not mock data.
  const participated = user.events_participated
  const won = user.events_won
  const winRate = participated > 0 ? Math.round((won / participated) * 100) : 0
  const xp = participated * 100 + won * 250
  const level = Math.floor(xp / 1000) + 1
  const xpInLevel = xp % 1000
  const profile = {
    level,
    xp,
    xp_to_next: 1000 - xpInLevel,
    win_rate: winRate,
    recent_form: [] as string[],       // no per-match result data yet — section hidden
    sport_stats: [] as { category: any; matches: number; wins: number; losses: number; highlights: Record<string, any> }[],
    achievements: [
      { id: 'first_event', emoji: '🎯', title: 'First Event',  unlocked: participated >= 1 },
      { id: 'five_events',  emoji: '🔥', title: '5 Events',     unlocked: participated >= 5 },
      { id: 'first_win',    emoji: '🏆', title: 'First Win',    unlocked: won >= 1 },
      { id: 'champion',     emoji: '👑', title: 'Champion',     unlocked: won >= 5 },
      { id: 'big_winner',   emoji: '💰', title: '₹10k Won',     unlocked: user.total_winnings >= 10000 },
      { id: 'verified',     emoji: '✅', title: 'Verified',     unlocked: user.verification_status === 'verified' },
    ],
  }
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const upcomingCount = tickets.filter(t => t.status === 'upcoming').length
  const xpPct = Math.round((xpInLevel / 1000) * 100)
  const career = computeCareer(myScores as any)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile header card */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ backgroundColor: THEME.card, borderBottomWidth: 1, borderBottomColor: THEME.border, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {/* Avatar */}
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: THEME.orange, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'white' }}>{initials}</Text>
            </View>

            {/* Name + details */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: THEME.text }}>{user.name}</Text>
                {user.verification_status === 'verified' && (
                  <CheckCircle2 size={16} color={THEME.orange} fill={THEME.orange} strokeWidth={2} />
                )}
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.textSecondary }}>@{user.username}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: THEME.textTertiary, marginTop: 2 }}>📍 {user.city}</Text>
            </View>

            {/* Level badge */}
            <View style={{ alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: THEME.orangeBg, borderWidth: 1.5, borderColor: THEME.orangeLight }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: THEME.orange }}>{profile.level}</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, color: THEME.orange, marginTop: 1 }}>LEVEL</Text>
            </View>
          </View>

          {/* XP progress bar */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Zap size={11} color={THEME.orange} fill={THEME.orange} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: THEME.text }}>
                  {profile.xp.toLocaleString()} XP
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>
                {profile.xp_to_next.toLocaleString()} to Level {profile.level + 1}
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: 8, width: `${xpPct}%` as any, backgroundColor: THEME.orange, borderRadius: 4 }} />
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border }}>
            {[
              { value: user.events_participated, label: 'Events' },
              { value: user.events_won, label: 'Wins' },
              { value: `${profile.win_rate}%`, label: 'Win Rate' },
              { value: formatCurrency(user.total_winnings), label: 'Winnings' },
            ].map(({ value, label }, i) => (
              <View key={label} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: i < 3 ? 1 : 0, borderRightColor: THEME.border }}>
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15, color: THEME.text }}>{value}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: THEME.textTertiary, marginTop: 2 }}>{label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Wallet card */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 4 }}>
          <View style={{ backgroundColor: THEME.orange, borderRadius: 18, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Wallet Balance</Text>
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 28, color: 'white', marginTop: 4 }}>
                  {formatCurrency(user.wallet_balance)}
                </Text>
              </View>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={24} color="white" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable style={{ flex: 1, backgroundColor: 'white', paddingVertical: 11, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.orangeDark }}>Add Money</Text>
              </Pressable>
              <Pressable style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 11, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'white' }}>Withdraw</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Host Dashboard entry */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Pressable
            onPress={() => router.push('/host-dashboard' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: THEME.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: THEME.border }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text }}>Host Dashboard</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>Manage your events & score matches live</Text>
            </View>
            <ChevronRight size={18} color={THEME.textTertiary} />
          </Pressable>
        </Animated.View>

        {/* Recent form */}
        {profile.recent_form.length > 0 && (
        <Animated.View entering={FadeInDown.delay(120).springify()} style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: THEME.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: THEME.border }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text, marginBottom: 12 }}>Recent Form</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {profile.recent_form.map((r, i) => (
              <View key={i} style={{
                width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                backgroundColor: r === 'W' ? '#000000' : r === 'L' ? '#F0F0F0' : '#F5F5F5',
                borderWidth: 1.5,
                borderColor: r === 'W' ? '#000000' : '#E8E8E8',
              }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: r === 'W' ? '#FFFFFF' : '#4A4A4A' }}>{r}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
        )}

        {/* Sport stats */}
        {profile.sport_stats.length > 0 && (
        <Animated.View entering={FadeInDown.delay(160).springify()} style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text, marginBottom: 12 }}>Sport Stats</Text>
          {profile.sport_stats.map(stat => {
            const meta = categoryMeta[stat.category as keyof typeof categoryMeta]
            const winPct = stat.matches > 0 ? Math.round((stat.wins / stat.matches) * 100) : 0
            return (
              <View key={stat.category} style={{
                backgroundColor: THEME.card, borderRadius: 14, padding: 14, marginBottom: 10,
                borderWidth: 1, borderColor: THEME.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text }}>{meta.label}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: THEME.orangeBg }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: THEME.orangeDark }}>{winPct}% win</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {[
                    { label: 'Matches', value: stat.matches },
                    { label: 'Wins',    value: stat.wins },
                    { label: 'Losses',  value: stat.losses },
                    ...Object.entries(stat.highlights).slice(0, 1).map(([key, val]) => ({ label: key, value: val })),
                  ].map(({ label, value }) => (
                    <View key={label}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: THEME.text }}>{value}</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: THEME.textTertiary }}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          })}
        </Animated.View>
        )}

        {/* Career Stats — ESPN / CricHeroes style, per sport */}
        {career.length > 0 && (
        <Animated.View entering={FadeInDown.delay(130).springify()} style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text, marginBottom: 12 }}>Career Stats</Text>
          {career.map((c: any) => {
            const meta = categoryMeta[c.category as keyof typeof categoryMeta] ?? categoryMeta.other
            const cell = (l: string, v: any, key: string) => (
              <View key={key} style={{ width: '25%', marginBottom: 12 }}>
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15, color: THEME.text }}>{String(v)}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 9, color: THEME.textTertiary, marginTop: 1 }}>{l}</Text>
              </View>
            )
            const b = c.cricket?.batting
            const bw = c.cricket?.bowling
            return (
              <View key={c.category} style={{ backgroundColor: THEME.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: THEME.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text, flex: 1 }}>{meta.label}</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: THEME.textTertiary }}>{c.matches} {c.matches === 1 ? 'match' : 'matches'}</Text>
                </View>

                {c.cricket ? (
                  <>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: THEME.textTertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Batting</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {cell('Inns', b.innings, 'inns')}
                      {cell('Runs', b.runs, 'runs')}
                      {cell('HS', b.highScore, 'hs')}
                      {cell('Avg', b.average, 'avg')}
                      {cell('SR', b.strikeRate, 'sr')}
                      {cell('50s', b.fifties, '50')}
                      {cell('100s', b.hundreds, '100')}
                      {cell('4s/6s', `${b.fours}/${b.sixes}`, '46')}
                    </View>
                    {bw.innings > 0 && (
                      <>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: THEME.textTertiary, marginVertical: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bowling</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {cell('Wkts', bw.wickets, 'wkts')}
                          {cell('Overs', bw.overs, 'ov')}
                          {cell('Econ', bw.economy, 'econ')}
                          {cell('Best', bw.best, 'best')}
                        </View>
                      </>
                    )}
                    {c.cricket.catches > 0 && (
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textSecondary, marginTop: 2 }}>🧤 {c.cricket.catches} catches</Text>
                    )}
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {(c.tiles ?? []).map((t: any, ti: number) => cell(t.label, t.value, `t${ti}`))}
                  </View>
                )}
              </View>
            )
          })}
        </Animated.View>
        )}

        {/* Match History — personal scores */}
        {myScores.length > 0 && (
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text, marginBottom: 12 }}>Match History</Text>
          {myScores.map((s: any, i: number) => {
            const meta = categoryMeta[s.category as keyof typeof categoryMeta] ?? categoryMeta.other
            return (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: THEME.card, borderRadius: 14, padding: 14, marginBottom: 10,
                borderWidth: 1, borderColor: THEME.border,
              }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: THEME.text }}>{s.match_title}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: THEME.textTertiary }}>
                    {s.team ? `${s.team} · ` : ''}{meta.label}{s.status ? ` · ${s.status}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', maxWidth: 130 }}>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: THEME.text }}>{s.score}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: THEME.textTertiary }}>{s.detail}</Text>
                </View>
              </View>
            )
          })}
        </Animated.View>
        )}

        {/* Achievements */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text, marginBottom: 12 }}>Achievements</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {profile.achievements.map(a => (
              <View key={a.id} style={{
                width: '30%', borderRadius: 14, padding: 12, alignItems: 'center',
                backgroundColor: a.unlocked ? THEME.orangeBg : '#F3F4F6',
                borderWidth: 1.5, borderColor: a.unlocked ? THEME.orangeLight : THEME.border,
                opacity: a.unlocked ? 1 : 0.45,
              }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{a.emoji}</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: a.unlocked ? THEME.orangeDark : THEME.textSecondary, textAlign: 'center', lineHeight: 13 }}>
                  {a.title}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Sports interests */}
        <Animated.View entering={FadeInDown.delay(240).springify()} style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: THEME.text, marginBottom: 10 }}>Sports Interests</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {user.sports_interests.map(s => {
              const meta = categoryMeta[s]
              return (
                <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: meta.bg, borderWidth: 1, borderColor: meta.color + '30' }}>
                  <Text style={{ fontSize: 14 }}>{meta.emoji}</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: meta.color }}>{meta.label}</Text>
                </View>
              )
            })}
          </View>
        </Animated.View>

        {/* Bio */}
        {user.bio ? (
          <Animated.View entering={FadeInDown.delay(280).springify()} style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ backgroundColor: THEME.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: THEME.border }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: THEME.textSecondary, lineHeight: 20 }}>{user.bio}</Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Sign out */}
        <Animated.View entering={FadeInDown.delay(320).springify()} style={{ marginHorizontal: 16, marginBottom: 32 }}>
          <Pressable
            onPress={logout}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, paddingVertical: 15, borderRadius: 16,
              backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E8E8E8',
            }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#4A4A4A' }}>Sign Out</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  )
}
