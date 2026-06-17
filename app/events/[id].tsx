import { ScrollView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, MapPin, Users, Trophy, Shield, Clock, ChevronRight, CheckCircle2 } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState, useEffect } from 'react'
import RazorpayCheckout from '../../lib/razorpay'
import { useEventStore } from '../../stores/eventStore'
import { useAuthStore } from '../../stores/authStore'
import { categoryMeta, statusMeta, formatCurrency, getRegistrationPercentage, getSpotsLeft, formatDate, THEME } from '../../lib/utils'
import { supabase as _supabase } from '../../lib/supabase'
const supabase = _supabase as any

type Tab = 'details' | 'rules' | 'prizes'
type Step = 'view' | 'register' | 'payment' | 'success'

export default function EventDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const events = useEventStore((s) => s.events)
  const fetchEvents = useEventStore((s) => s.fetchEvents)
  const loading = useEventStore((s) => s.loading)
  const registerForEvent = useEventStore((s) => s.registerForEvent)
  const createTicketInDB = useEventStore((s) => s.createTicketInDB)
  const saveTeamMembers = useEventStore((s) => s.saveTeamMembers)
  const getMyTicketForEvent = useEventStore((s) => s.getMyTicketForEvent)
  const user = useAuthStore((s) => s.user)
  const updateWallet = useAuthStore((s) => s.updateWallet)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [tab, setTab] = useState<Tab>('details')
  const [step, setStep] = useState<Step>('view')
  const [liked, setLiked] = useState(false)
  const [participantName, setParticipantName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState<{ name: string; phone: string }[]>([])
  const [myTicketId, setMyTicketId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'upi' | 'card'>('wallet')
  const [upiId, setUpiId] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (events.length === 0) fetchEvents()
  }, [])

  // For team events: seed the roster inputs and detect an existing registration.
  useEffect(() => {
    const ev = events.find((e) => e.id === id)
    if (!ev || !user || !ev.team_config) return
    const n = ev.team_config.max_players || 2
    setMembers((prev) => prev.length ? prev : Array.from({ length: n }, (_, i) =>
      i === 0 ? { name: user.name ?? '', phone: user.phone ?? '' } : { name: '', phone: '' }))
    getMyTicketForEvent(ev.id, user.id).then((t) => setMyTicketId(t?.id ?? null))
  }, [events, id, user?.id])

  const event = events.find((e) => e.id === id) ?? events[0]

  if (!event || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F5F7', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    )
  }

  const meta = categoryMeta[event.category]
  const status = statusMeta[event.status]

  const pct = getRegistrationPercentage(event.current_participants, event.max_participants)
  const spotsLeft = getSpotsLeft(event.current_participants, event.max_participants)
  const isFull = spotsLeft <= 0
  const walletBalance = user?.wallet_balance ?? 0
  const canPayWallet = walletBalance >= event.entry_fee

  async function handleConfirmPayment() {
    if (!user) return
    if (paymentMethod === 'wallet' && !canPayWallet) {
      Alert.alert('Insufficient Balance', 'Please add funds to your wallet or choose another payment method.')
      return
    }
    if (paymentMethod === 'upi' && !upiId.includes('@')) {
      Alert.alert('Invalid UPI', 'Please enter a valid UPI ID (e.g. name@upi)')
      return
    }

    setPaying(true)

    try {
      let razorpayPaymentId: string | undefined
      let razorpayOrderId: string | undefined

      if (event.entry_fee > 0 && paymentMethod !== 'wallet') {
        const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
          body: { amount: event.entry_fee, eventId: event.id, userId: user.id },
        })
        if (orderError || !orderData?.id) {
          Alert.alert('Payment Error', 'Could not create payment order. Try wallet payment.')
          setPaying(false)
          return
        }

        const razorpayOptions = {
          description: `Registration: ${event.title}`,
          currency: 'INR',
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '',
          amount: event.entry_fee * 100,
          name: 'Torevo',
          order_id: orderData.id,
          prefill: {
            contact: user.phone,
            name: user.name,
          },
          theme: { color: THEME.orange },
        }

        const payment = await RazorpayCheckout.open(razorpayOptions)
        razorpayPaymentId = payment.razorpay_payment_id
        razorpayOrderId = payment.razorpay_order_id
      }

      const { ticket, error, walletDebited } = await createTicketInDB({
        eventId: event.id,
        userId: user.id,
        participantName,
        teamName: teamName || undefined,
        amountPaid: event.entry_fee,
        paymentMethod,
        razorpayPaymentId,
        razorpayOrderId,
      })

      if (error || !ticket) {
        Alert.alert('Registration Failed', error ?? 'Please try again.')
        setPaying(false)
        return
      }

      // Only debit on the client when the server didn't already (legacy path).
      if (paymentMethod === 'wallet') {
        if (walletDebited) updateUser({ wallet_balance: walletBalance - event.entry_fee })
        else updateWallet(-event.entry_fee)
      }
      registerForEvent(event.id, ticket)
      // Save the team roster (phone numbers) against this ticket.
      if (event.team_config) {
        try { await saveTeamMembers(ticket.id, members); setMyTicketId(ticket.id) } catch {}
      }
      setStep('success')
    } catch (err: any) {
      if (err?.code !== 2) {
        Alert.alert('Payment Failed', err?.description ?? 'Payment was not completed.')
      }
    } finally {
      setPaying(false)
    }
  }

  // --- SUCCESS ---
  if (step === 'success') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.orange, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <CheckCircle2 size={40} color="white" strokeWidth={1.5} />
          </View>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, color: THEME.text, textAlign: 'center' }}>Registered!</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', textAlign: 'center', marginTop: 8, lineHeight: 21 }}>
            {'You\'re in for '}
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#09090B' }}>{event.title}</Text>
          </Text>
          {event.escrow_protected && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#71717A', textAlign: 'center', marginTop: 4 }}>
              Your payment is secured in Torevo Escrow.
            </Text>
          )}

          {event.escrow_protected && event.entry_fee > 0 && (
            <View style={{ marginTop: 20, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F4F4F5', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E4E4E7' }}>
              <Shield size={18} color="#09090B" />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#52525B', flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold' }}>{formatCurrency(event.entry_fee)}</Text> held in escrow. Full refund if the event is cancelled.
              </Text>
            </View>
          )}

          <View style={{ marginTop: 20, width: '100%', backgroundColor: '#09090B', borderRadius: 18, padding: 18 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: 'white' }}>{event.title}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {formatDate(event.date)} · {event.time}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {event.location.venue_name}, {event.location.city}
            </Text>
          </View>

          <Pressable onPress={() => router.push('/(tabs)/tickets' as any)} style={{ marginTop: 16, width: '100%', backgroundColor: THEME.orange, paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: 'white' }}>View My Ticket</Text>
          </Pressable>
          {event.team_config && (
            <Pressable onPress={() => router.push(`/team/${event.id}` as any)} style={{ marginTop: 10, width: '100%', backgroundColor: '#F4F4F5', paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E4E4E7' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#09090B' }}>Manage Team Roster</Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/')} style={{ marginTop: 10, paddingVertical: 8 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A1A1AA' }}>Back to events</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Back bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52 }}>
          <Pressable onPress={() => step !== 'view' ? setStep('view') : (router.canGoBack() ? router.back() : router.push('/'))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} color="#09090B" />
          </Pressable>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#09090B' }}>
            {step === 'register' ? 'Register' : step === 'payment' ? 'Payment' : 'Event Detail'}
          </Text>
          <Pressable onPress={() => setLiked(!liked)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>{liked ? '❤️' : '♡'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero — sport cover photo */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111' }}>
            <View style={{ height: 180, position: 'relative' }}>
              <Image source={meta.image} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.32)' }} />
              <View style={{ position: 'absolute', top: 12, left: 12 }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: status.bg }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: status.text }}>{status.label}</Text>
                </View>
              </View>
              {event.prize_pool > 0 && (
                <View style={{ position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: THEME.orange }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: 'white' }}>🏆 {formatCurrency(event.prize_pool)} PRIZE</Text>
                </View>
              )}
              {event.escrow_protected && (
                <View style={{ position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.15)' }}>
                  <Shield size={10} color="white" />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: 'white' }}>Escrow</Text>
                </View>
              )}
            </View>
            {/* Title band */}
            <View style={{ backgroundColor: THEME.text, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: 'white', lineHeight: 22 }}>{event.title}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                {meta.label} · {event.event_type}
              </Text>
            </View>
          </View>

          {/* ---- VIEW STEP ---- */}
          {step === 'view' && (
            <>
              {/* Key info pills */}
              <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 16 }}>
                {[
                  { icon: Clock, text: `${formatDate(event.date)} · ${event.time}` },
                  { icon: MapPin, text: `${event.location.venue_name}, ${event.location.city}` },
                  { icon: Users, text: `${event.current_participants}/${event.max_participants} spots · ${spotsLeft} left` },
                  ...(event.prize_pool > 0 ? [{ icon: Trophy, text: `Prize pool: ${formatCurrency(event.prize_pool)}` }] : []),
                  ...(event.escrow_protected ? [{ icon: Shield, text: 'Payments secured by Torevo Escrow' }] : []),
                ].map(({ icon: Icon, text }, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={15} color="#52525B" />
                    </View>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#3F3F46', flex: 1 }}>{text}</Text>
                  </View>
                ))}
              </View>

              {/* Fill bar */}
              <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#09090B' }}>{pct}% filled</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#A1A1AA' }}>{spotsLeft} spots left</Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#F4F4F5', borderRadius: 3 }}>
                  <View style={{ height: 6, width: `${pct}%` as any, backgroundColor: pct > 85 ? THEME.red : THEME.orange, borderRadius: 3 }} />
                </View>
              </View>

              {/* Tabs */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginBottom: 16 }}>
                {(['details', 'rules', 'prizes'] as Tab[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTab(t)}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: tab === t ? THEME.orange : '#F4F4F5' }}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: tab === t ? 'white' : '#71717A', textTransform: 'capitalize' }}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Tab content */}
              <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                {tab === 'details' && (
                  <>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>About</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#71717A', lineHeight: 20, marginBottom: 16 }}>{event.description}</Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#09090B', marginBottom: 8 }}>Organizer</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#F4F4F5', borderRadius: 14 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#09090B', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#09090B' }}>{event.organizer.name}</Text>
                          {event.organizer.verification_status === 'verified' && (
                            <CheckCircle2 size={13} color="#09090B" fill="#09090B" strokeWidth={2} />
                          )}
                        </View>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#71717A' }}>
                          ⭐ {event.organizer.rating} · {event.organizer.events_hosted} events
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#D4D4D8" />
                    </View>
                    {event.refund_policy && (
                      <View style={{ marginTop: 14, padding: 14, backgroundColor: '#F4F4F5', borderRadius: 12, borderWidth: 1, borderColor: '#E4E4E7' }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#09090B', marginBottom: 4 }}>Refund Policy</Text>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#71717A' }}>{event.refund_policy}</Text>
                      </View>
                    )}
                  </>
                )}

                {tab === 'rules' && (
                  <>
                    {event.rules.map((rule, i) => (
                      <View key={i} style={{ marginBottom: 14, padding: 14, backgroundColor: '#F4F4F5', borderRadius: 14 }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#09090B', marginBottom: 4 }}>{rule.title}</Text>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#71717A', lineHeight: 19 }}>{rule.description}</Text>
                      </View>
                    ))}
                    {event.escrow_protected && (
                      <View style={{ padding: 14, backgroundColor: '#09090B', borderRadius: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <Shield size={16} color="white" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: 'white', marginBottom: 6 }}>Anti-Fraud Protection</Text>
                          {['GPS check-in required 20 mins before start', 'Entry fees locked in escrow until result verified', '48hr dispute window after event ends', 'Organizer KYC verified'].map((t, i) => (
                            <Text key={i} style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>✓ {t}</Text>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                )}

                {tab === 'prizes' && (
                  event.prizes.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                      <Text style={{ fontSize: 40, marginBottom: 12 }}>🎖️</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#A1A1AA', textAlign: 'center' }}>
                        {event.entry_fee === 0 ? 'Free event — no prize pool' : 'Prizes announced closer to the event date'}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={{ marginBottom: 16, padding: 16, backgroundColor: THEME.orange, borderRadius: 16, alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Total Prize Pool</Text>
                        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 28, color: 'white', marginTop: 2 }}>{formatCurrency(event.prize_pool)}</Text>
                        {event.escrow_protected && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                            <Shield size={11} color="rgba(255,255,255,0.5)" />
                            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>100% secured in escrow</Text>
                          </View>
                        )}
                      </View>
                      {event.prizes.map((prize, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F4F4F5', borderRadius: 12, marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontSize: 22 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</Text>
                            <View>
                              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#09090B' }}>{prize.label}</Text>
                              {prize.description && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#A1A1AA' }}>{prize.description}</Text>}
                            </View>
                          </View>
                          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15, color: '#09090B' }}>{formatCurrency(prize.amount)}</Text>
                        </View>
                      ))}
                    </>
                  )
                )}
              </View>
            </>
          )}

          {/* ---- REGISTER STEP ---- */}
          {step === 'register' && (
            <Animated.View entering={FadeInDown.springify()} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: '#09090B', marginBottom: 4 }}>Your Details</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#71717A', marginBottom: 20 }}>Fill in your info to register</Text>

              {[
                { label: 'Full Name *', value: participantName, set: setParticipantName, placeholder: 'Your full name' },
                { label: 'Phone Number *', value: phone, set: setPhone, placeholder: '+91 XXXXX XXXXX', keyboard: 'phone-pad' as const },
                ...(event.team_config ? [{ label: 'Team Name', value: teamName, set: setTeamName, placeholder: 'e.g. Powai Strikers' }] : []),
              ].map(({ label, value, set, placeholder, keyboard }) => (
                <View key={label} style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>{label}</Text>
                  <TextInput
                    value={value} onChangeText={set}
                    placeholder={placeholder} placeholderTextColor="#A1A1AA"
                    keyboardType={keyboard}
                    style={{ borderWidth: 1.5, borderColor: value.length > 0 ? '#09090B' : '#E4E4E7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B' }}
                  />
                </View>
              ))}

              {event.category === 'esports' && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>Game ID / Username *</Text>
                  <TextInput placeholder="Your in-game ID" placeholderTextColor="#A1A1AA" style={{ borderWidth: 1.5, borderColor: '#E4E4E7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B' }} />
                </View>
              )}

              {/* Team roster — every teammate's mobile number */}
              {event.team_config && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 2 }}>
                    Team players · {event.team_config.max_players} required
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#71717A', marginBottom: 10 }}>
                    Add each teammate's mobile number — you can edit these any time until the event ends.
                  </Text>
                  {members.map((m, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                      <TextInput value={m.name}
                        onChangeText={(t) => setMembers((ms) => ms.map((x, j) => j === i ? { ...x, name: t } : x))}
                        placeholder={i === 0 ? 'You' : `Player ${i + 1}`} placeholderTextColor="#A1A1AA"
                        style={{ flex: 1.2, borderWidth: 1.5, borderColor: m.name ? '#09090B' : '#E4E4E7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 13, color: '#09090B' }} />
                      <TextInput value={m.phone}
                        onChangeText={(t) => setMembers((ms) => ms.map((x, j) => j === i ? { ...x, phone: t } : x))}
                        placeholder="Mobile" placeholderTextColor="#A1A1AA" keyboardType="phone-pad"
                        style={{ flex: 1, borderWidth: 1.5, borderColor: m.phone ? '#09090B' : '#E4E4E7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 13, color: '#09090B' }} />
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* ---- PAYMENT STEP ---- */}
          {step === 'payment' && (
            <Animated.View entering={FadeInDown.springify()} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: '#09090B', marginBottom: 4 }}>Payment</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#71717A', marginBottom: 20 }}>Choose how to pay</Text>

              {/* Order summary */}
              <View style={{ backgroundColor: '#09090B', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: 'white', marginBottom: 12 }}>Order Summary</Text>
                {[
                  { label: 'Entry Fee', value: formatCurrency(event.entry_fee) },
                  { label: 'Platform Fee', value: '₹0' },
                  { label: 'Total', value: formatCurrency(event.entry_fee), bold: true },
                ].map(({ label, value, bold }) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: label === 'Total' ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                    <Text style={{ fontFamily: bold ? 'Inter_700Bold' : 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</Text>
                    <Text style={{ fontFamily: bold ? 'Inter_900Black' : 'Inter_600SemiBold', fontSize: bold ? 16 : 13, color: 'white' }}>{value}</Text>
                  </View>
                ))}
              </View>

              {/* Payment methods */}
              {[
                { key: 'wallet' as const, label: `Torevo Wallet`, sub: `Balance: ${formatCurrency(walletBalance)}`, emoji: '👛', disabled: !canPayWallet },
                { key: 'upi' as const, label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', emoji: '📱', disabled: false },
                { key: 'card' as const, label: 'Card', sub: 'Credit / Debit card', emoji: '💳', disabled: false },
              ].map(({ key, label, sub, emoji, disabled }) => (
                <Pressable
                  key={key}
                  onPress={() => !disabled && setPaymentMethod(key)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 14, borderRadius: 14, marginBottom: 10,
                    borderWidth: 2, borderColor: paymentMethod === key ? THEME.orange : '#E4E4E7',
                    backgroundColor: disabled ? '#F9F9F9' : 'white', opacity: disabled ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#09090B' }}>{label}</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: disabled ? '#3F3F46' : '#A1A1AA' }}>
                      {disabled ? 'Insufficient balance' : sub}
                    </Text>
                  </View>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: paymentMethod === key ? THEME.orange : '#D4D4D8', backgroundColor: paymentMethod === key ? THEME.orange : 'white', alignItems: 'center', justifyContent: 'center' }}>
                    {paymentMethod === key && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />}
                  </View>
                </Pressable>
              ))}

              {paymentMethod === 'upi' && (
                <View style={{ marginTop: 4 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>UPI ID</Text>
                  <TextInput
                    value={upiId} onChangeText={setUpiId}
                    placeholder="yourname@upi" placeholderTextColor="#A1A1AA"
                    style={{ borderWidth: 1.5, borderColor: '#E4E4E7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B' }}
                  />
                </View>
              )}

              {event.escrow_protected && (
                <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, backgroundColor: '#F4F4F5', borderRadius: 12, borderWidth: 1, borderColor: '#E4E4E7' }}>
                  <Shield size={14} color="#09090B" />
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#52525B', flex: 1 }}>
                    Payment held in Torevo Escrow — released only after the event is completed and verified.
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer CTA */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F4F4F5', backgroundColor: 'white', flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {step === 'view' && (() => {
            const deadlinePassed = event.registration_deadline
              ? new Date() > new Date(event.registration_deadline)
              : false
            const blocked = isFull || deadlinePassed || event.status === 'completed' || event.status === 'cancelled'
            // Already registered a team → offer roster editing instead of re-register.
            if (myTicketId && event.team_config) {
              return (
                <Pressable onPress={() => router.push(`/team/${event.id}` as any)} style={{ flex: 1, backgroundColor: '#09090B', paddingVertical: 15, borderRadius: 18, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: 'white' }}>Edit Team Roster</Text>
                </Pressable>
              )
            }
            const btnLabel = isFull ? 'Sold Out'
              : deadlinePassed ? 'Registration Closed'
              : event.status === 'completed' ? 'Event Ended'
              : event.status === 'cancelled' ? 'Cancelled'
              : 'Register Now →'
            return (
              <>
                <View>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#09090B' }}>
                    {event.entry_fee === 0 ? 'Free' : formatCurrency(event.entry_fee)}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#A1A1AA' }}>{event.team_config ? 'per team' : 'per person'}</Text>
                </View>
                <Pressable
                  onPress={() => blocked ? null : setStep('register')}
                  disabled={blocked}
                  style={{ flex: 1, backgroundColor: blocked ? '#E4E4E7' : THEME.orange, paddingVertical: 15, borderRadius: 18, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: blocked ? '#A1A1AA' : 'white' }}>
                    {btnLabel}
                  </Text>
                </Pressable>
              </>
            )
          })()}
          {step === 'register' && (
            <>
              <Pressable onPress={() => setStep('view')} style={{ flex: 0.35, paddingVertical: 15, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#52525B' }}>Back</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (participantName.length > 1 && phone.length > 5) {
                    if (event.entry_fee > 0) {
                      setStep('payment')
                    } else {
                      if (!user) return
                      setPaying(true)
                      const { ticket, error } = await createTicketInDB({
                        eventId: event.id, userId: user.id,
                        participantName, teamName,
                        amountPaid: 0, paymentMethod: 'free',
                      })
                      setPaying(false)
                      if (error || !ticket) { Alert.alert('Error', error ?? 'Registration failed'); return }
                      registerForEvent(event.id, ticket)
                      setStep('success')
                    }
                  }
                }}
                disabled={paying}
                style={{ flex: 1, backgroundColor: THEME.orange, paddingVertical: 15, borderRadius: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                {paying && <ActivityIndicator size="small" color="white" />}
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: 'white' }}>
                  {event.entry_fee > 0 ? 'Continue to Payment' : 'Confirm Registration'}
                </Text>
              </Pressable>
            </>
          )}
          {step === 'payment' && (
            <>
              <Pressable onPress={() => setStep('register')} disabled={paying} style={{ flex: 0.35, paddingVertical: 15, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#52525B' }}>Back</Text>
              </Pressable>
              <Pressable onPress={handleConfirmPayment} disabled={paying} style={{ flex: 1, backgroundColor: THEME.orange, paddingVertical: 15, borderRadius: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {paying && <ActivityIndicator size="small" color="white" />}
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: 'white' }}>{paying ? 'Processing...' : `Pay ${formatCurrency(event.entry_fee)} →`}</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
