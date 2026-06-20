import { ScrollView, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator } from 'react-native'
import { toast } from '../stores/toastStore'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X, ChevronRight, CheckCircle2 } from 'lucide-react-native'
import Animated, { FadeInRight, FadeInDown, FadeOutLeft } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useEventStore } from '../stores/eventStore'
import { categoryMeta } from '../lib/utils'
import { defaultFormat, defaultTeamSize, isTeamFormat, type EventFormat } from '../lib/formats'

// Uses the shared cover images (categoryMeta), NOT the BY SPORT browse art in assets/sports/*.png.
const SPORTS = [
  { id: 'cricket',      name: 'Cricket',      image: categoryMeta.cricket.image },
  { id: 'football',     name: 'Football',     image: categoryMeta.football.image },
  { id: 'badminton',    name: 'Badminton',    image: categoryMeta.badminton.image },
  { id: 'kabaddi',      name: 'Kabaddi',      image: categoryMeta.kabaddi.image },
  { id: 'basketball',   name: 'Basketball',   image: categoryMeta.basketball.image },
  { id: 'volleyball',   name: 'Volleyball',   image: categoryMeta.volleyball.image },
  { id: 'table_tennis', name: 'Table Tennis', image: categoryMeta.table_tennis.image },
  { id: 'chess',        name: 'Chess',        image: categoryMeta.chess.image },
  { id: 'esports',      name: 'Esports',      image: categoryMeta.esports.image },
  { id: 'pickleball',   name: 'Pickleball',   image: categoryMeta.pickleball.image },
]

const STEPS = ['Sport', 'Details', 'Schedule', 'Confirm']

type Step = 0 | 1 | 2 | 3 | 4

export default function CreateEventScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const fetchEvents = useEventStore((s) => s.fetchEvents)
  const [step, setStep] = useState<Step>(0)
  const [publishing, setPublishing] = useState(false)

  // Form state
  const [sport, setSport] = useState('')
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('16')
  const [format, setFormat] = useState<EventFormat>('individual')
  const [teamCount, setTeamCount] = useState('8')
  const [teamSize, setTeamSize] = useState('5')
  const [fee, setFee] = useState('')
  const [prizePool, setPrizePool] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [paymentType, setPaymentType] = useState<'one-time' | 'escrow'>('escrow')

  // When the sport changes, default the format + squad size to that game.
  useEffect(() => {
    if (!sport) return
    const f = defaultFormat(sport as any)
    setFormat(f)
    setTeamSize(String(defaultTeamSize(sport as any, f)))
  }, [sport])

  const canAdvance = () => {
    if (step === 0) return sport !== ''
    if (step === 1) return title.length >= 3 && venue.length >= 3
    if (step === 2) return date.length >= 3 && time.length >= 3
    return true
  }

  const next = async () => {
    if (step < 3) { setStep((step + 1) as Step); return }
    // Step 3 → Publish to Supabase
    if (!user) { toast('You must be logged in to create an event.', 'error'); return }
    setPublishing(true)

    // Build registration deadline from the event date+time (registration closes at start)
    const deadlineIso = (() => {
      const d = new Date(`${date}T${(time || '00:00').replace('.', ':')}:00`)
      return isNaN(d.getTime()) ? null : d.toISOString()
    })()

    const entryFee = parseInt(fee) || 0
    const prize = parseInt(prizePool) || 0
    const team = isTeamFormat(format)
    const tCount = parseInt(teamCount) || 0
    const tSize = parseInt(teamSize) || 0
    const maxP = team ? tCount * tSize : (parseInt(maxPlayers) || 0)

    const { data: created, error } = await (supabase as any)
      .from('events')
      .insert({
        title,
        description: description || '',
        category: sport,
        event_type: 'tournament',
        status: 'upcoming',
        date,
        time,
        registration_deadline: deadlineIso,
        starts_at: deadlineIso,
        registration_closes_at: deadlineIso,
        venue_name: venue,
        venue_address: venue,
        city: user.city ?? 'India',
        state: '',
        max_participants: maxP || 16,
        current_participants: 0,
        format,
        team_size: team ? tSize : null,
        team_count: team ? tCount : null,
        fee_mode: team ? 'per_team' : 'per_person',
        team_size_min: team ? tSize : null,
        team_size_max: team ? tSize : null,
        entry_fee: entryFee,
        prize_pool: prize,
        escrow_protected: paymentType === 'escrow',
        skill_level: 'all',
        refund_policy: paymentType === 'escrow'
          ? 'Full refund if the event is cancelled by the organizer.'
          : 'No refunds once registered.',
        equipment_provided: false,
        organizer_id: user.id,
        organizer_name: user.name,
        organizer_rating: 0,
        organizer_events_hosted: 0,
        organizer_verified: user.verification_status === 'verified',
      })
      .select()
      .single()

    if (error) { setPublishing(false); toast('Failed to publish: ' + error.message, 'error'); return }

    // If a prize pool was set, record a first-place prize row
    if (prize > 0 && created?.id) {
      await (supabase as any).from('event_prizes').insert({
        event_id: created.id,
        position: 1,
        label: '1st Place',
        amount: prize,
        description: null,
      })
    }

    setPublishing(false)
    await fetchEvents()
    setStep(4)
  }

  // Success screen
  if (step === 4) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
        >
          <CheckCircle2 size={72} color="#09090B" strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#09090B', marginTop: 20, textAlign: 'center' }}>
            Event Created!
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            Your event is live. Players can now register and payments will be held in escrow until the event ends.
          </Text>

          {/* Event summary card */}
          <View style={{
            marginTop: 28, width: '100%',
            backgroundColor: '#09090B', borderRadius: 20, padding: 20,
          }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: 'white' }}>{title}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              {date} · {time}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {venue}
            </Text>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
            }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Entry fee
              </Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FCD34D' }}>
                {fee ? `₹${fee}` : 'Free'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 20, width: '100%',
              backgroundColor: '#09090B',
              paddingVertical: 16, borderRadius: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: 'white' }}>Go to Home</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12, paddingVertical: 8 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A1A1AA' }}>Browse other events</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#09090B' }}>Create Event</Text>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#52525B" />
          </Pressable>
        </View>

        {/* Step indicator */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
            {STEPS.map((s, i) => (
              <View
                key={s}
                style={{
                  flex: 1, height: 4, borderRadius: 2,
                  backgroundColor: i <= step ? '#09090B' : '#E4E4E7',
                }}
              />
            ))}
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#A1A1AA' }}>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

          {/* Step 0: Sport Selection */}
          {step === 0 && (
            <Animated.View entering={FadeInRight.springify()} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22, color: '#09090B', marginBottom: 6 }}>
                Choose a Sport
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', marginBottom: 20 }}>
                What kind of event are you hosting?
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {SPORTS.map((s) => {
                  const selected = sport === s.id
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setSport(s.id)}
                      style={{
                        width: '47%', height: 180, borderRadius: 18, overflow: 'hidden',
                        backgroundColor: '#111111',
                        borderWidth: selected ? 2.5 : 0,
                        borderColor: '#FFFFFF',
                      }}
                    >
                      <Image
                        source={s.image}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      {/* Dark gradient */}
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(0,0,0,0.62)' }} />
                      <View style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        paddingVertical: 10, paddingHorizontal: 10,
                      }}>
                        <Text style={{
                          fontFamily: 'Inter_700Bold', fontSize: 10,
                          color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase',
                        }}>
                          {s.name}
                        </Text>
                      </View>
                      {selected && (
                        <View style={{
                          position: 'absolute', top: 8, right: 8,
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: 13, color: '#000', lineHeight: 18 }}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </Animated.View>
          )}

          {/* Step 1: Event Details */}
          {step === 1 && (
            <Animated.View entering={FadeInRight.springify()} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22, color: '#09090B', marginBottom: 6 }}>
                Event Details
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', marginBottom: 20 }}>
                Tell players about your event
              </Text>

              {[
                { label: 'Event Title', value: title, set: setTitle, placeholder: 'e.g. Powai Cricket T20 League', min: 3 },
                { label: 'Venue / Location', value: venue, set: setVenue, placeholder: 'e.g. BKC Ground, Mumbai', min: 3 },
              ].map(({ label, value, set, placeholder, min }) => (
                <View key={label} style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>
                    {label}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={set}
                    placeholder={placeholder}
                    placeholderTextColor="#A1A1AA"
                    style={{
                      borderWidth: 1.5, borderColor: value.length > 0 && value.length < min ? '#EF4444' : value.length >= min ? '#09090B' : '#E4E4E7',
                      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                      fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B',
                    }}
                  />
                  {value.length > 0 && value.length < min && (
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                      {value.length}/{min} min characters
                    </Text>
                  )}
                </View>
              ))}

              {/* Format selector */}
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>Format</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {(['team', 'doubles', 'individual'] as const).map(f => (
                  <Pressable key={f} onPress={() => { setFormat(f); setTeamSize(String(defaultTeamSize(sport as any, f))) }}
                    style={{ flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center', backgroundColor: format === f ? '#09090B' : '#F4F4F5', borderWidth: 1.5, borderColor: format === f ? '#09090B' : '#E4E4E7' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: format === f ? '#fff' : '#71717A', textTransform: 'capitalize' }}>{f}</Text>
                  </Pressable>
                ))}
              </View>

              {isTeamFormat(format) ? (
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>Number of teams</Text>
                    <TextInput value={teamCount} onChangeText={setTeamCount} keyboardType="number-pad"
                      style={{ borderWidth: 1.5, borderColor: '#E4E4E7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B' }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>Players / team</Text>
                    <TextInput value={teamSize} onChangeText={setTeamSize} keyboardType="number-pad"
                      style={{ borderWidth: 1.5, borderColor: '#E4E4E7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B' }} />
                  </View>
                </View>
              ) : (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>Max participants</Text>
                  <TextInput value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad"
                    style={{ borderWidth: 1.5, borderColor: '#E4E4E7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B' }} />
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>
                  Entry Fee (₹) · {isTeamFormat(format) ? 'per team' : 'per person'}
                </Text>
                <TextInput value={fee} onChangeText={setFee} keyboardType="number-pad" placeholder="0 = Free" placeholderTextColor="#A1A1AA"
                  style={{ borderWidth: 1.5, borderColor: '#E4E4E7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B' }} />
                {isTeamFormat(format) && (
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#71717A', marginTop: 4 }}>
                    {teamCount || 0} teams × {teamSize || 0} players = {(parseInt(teamCount) || 0) * (parseInt(teamSize) || 0)} player slots · one fee per team
                  </Text>
                )}
              </View>

              {fee && parseInt(fee) > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>Prize Pool (₹)</Text>
                  <TextInput
                    value={prizePool}
                    onChangeText={setPrizePool}
                    keyboardType="number-pad"
                    placeholder="Optional — total prize amount"
                    placeholderTextColor="#A1A1AA"
                    style={{
                      borderWidth: 1.5, borderColor: '#E4E4E7',
                      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                      fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B',
                    }}
                  />
                </View>
              )}

              {fee && parseInt(fee) > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 10 }}>
                    Payment Method
                  </Text>
                  <View style={{ flexDirection: 'row', borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E4E4E7' }}>
                    {(['escrow', 'one-time'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setPaymentType(type)}
                        style={{
                          flex: 1, paddingVertical: 12, alignItems: 'center',
                          backgroundColor: paymentType === type ? '#09090B' : 'white',
                        }}
                      >
                        <Text style={{
                          fontFamily: 'Inter_600SemiBold', fontSize: 13,
                          color: paymentType === type ? 'white' : '#71717A',
                        }}>
                          {type === 'escrow' ? '🔒 Escrow' : 'Direct Pay'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#A1A1AA', marginTop: 6 }}>
                    {paymentType === 'escrow'
                      ? '🛡️ Funds held safely until event ends — full refund if cancelled'
                      : 'Payment goes directly to you when players register'}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <Animated.View entering={FadeInRight.springify()} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22, color: '#09090B', marginBottom: 6 }}>
                When is it?
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', marginBottom: 20 }}>
                Set the date and time for your event
              </Text>

              {[
                { label: 'Date', value: date, set: setDate, placeholder: 'e.g. 14 Jun 2025', keyboard: 'default' as const },
                { label: 'Time', value: time, set: setTime, placeholder: 'e.g. 09:30 AM', keyboard: 'default' as const },
              ].map(({ label, value, set, placeholder, keyboard }) => (
                <View key={label} style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>
                    {label}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={set}
                    placeholder={placeholder}
                    placeholderTextColor="#A1A1AA"
                    keyboardType={keyboard}
                    style={{
                      borderWidth: 1.5,
                      borderColor: value.length >= 3 ? '#09090B' : '#E4E4E7',
                      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                      fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B',
                    }}
                  />
                </View>
              ))}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>
                  Description (optional)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Any additional details for players..."
                  placeholderTextColor="#A1A1AA"
                  multiline
                  numberOfLines={4}
                  style={{
                    borderWidth: 1.5, borderColor: '#E4E4E7',
                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                    fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B',
                    height: 100, textAlignVertical: 'top',
                  }}
                />
              </View>
            </Animated.View>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <Animated.View entering={FadeInRight.springify()} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22, color: '#09090B', marginBottom: 6 }}>
                Confirm Event
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', marginBottom: 20 }}>
                Review your event before publishing
              </Text>

              {/* Summary card */}
              <View style={{
                backgroundColor: '#09090B', borderRadius: 20, padding: 20, marginBottom: 20,
              }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: 'white', marginBottom: 4 }}>
                  {title}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>
                  {venue}
                </Text>

                {[
                  { label: 'Sport', value: SPORTS.find(s => s.id === sport)?.name ?? sport },
                  { label: 'Date', value: date },
                  { label: 'Time', value: time },
                  ...(isTeamFormat(format)
                    ? [{ label: 'Format', value: `${format} · ${teamCount} teams × ${teamSize}` }]
                    : [{ label: 'Format', value: `individual · ${maxPlayers} players` }]),
                  { label: 'Entry Fee', value: fee ? `₹${fee} ${isTeamFormat(format) ? '/team' : '/person'}` : 'Free' },
                  ...(prizePool ? [{ label: 'Prize Pool', value: `₹${prizePool}` }] : []),
                  ...(fee && parseInt(fee) > 0 ? [{ label: 'Payment', value: paymentType === 'escrow' ? '🔒 Escrow' : 'Direct' }] : []),
                ].map(({ label, value }) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: 'row', justifyContent: 'space-between',
                      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                      {label}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: 'white' }}>
                      {value}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{
                backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14,
                borderWidth: 1, borderColor: '#BBF7D0',
              }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#15803D' }}>
                  ✅ {fee && parseInt(fee) > 0
                    ? paymentType === 'escrow'
                      ? 'Entry fees will be held in Torevo escrow. Full refund if cancelled.'
                      : 'Players pay you directly on registration.'
                    : 'This is a free event. No payments involved.'}
                </Text>
              </View>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={{
          paddingHorizontal: 16, paddingVertical: 16,
          borderTopWidth: 1, borderTopColor: '#F4F4F5',
          backgroundColor: 'white',
          flexDirection: 'row', gap: 12,
        }}>
          {step > 0 && (
            <Pressable
              onPress={() => setStep((step - 1) as Step)}
              style={{
                flex: 0.4, paddingVertical: 16, borderRadius: 18,
                backgroundColor: '#F4F4F5', alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#52525B' }}>Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={!canAdvance()}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 18,
              backgroundColor: canAdvance() ? '#09090B' : '#E4E4E7',
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
            }}
          >
            {publishing && <ActivityIndicator size="small" color="white" />}
            <Text style={{
              fontFamily: 'Inter_700Bold', fontSize: 15,
              color: canAdvance() ? 'white' : '#A1A1AA',
            }}>
              {publishing ? 'Publishing...' : step === 3 ? 'Publish Event' : 'Continue'}
            </Text>
            {step < 3 && <ChevronRight size={16} color={canAdvance() ? 'white' : '#A1A1AA'} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
