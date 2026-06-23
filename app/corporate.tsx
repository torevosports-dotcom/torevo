import { ScrollView, View, Text, Pressable, TextInput, Alert } from 'react-native'
import { toast } from '../stores/toastStore'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, CheckCircle2, Users, Clock, Building2, Shield } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { useEventStore } from '../stores/eventStore'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'

export default function CorporateScreen() {
  const router = useRouter()
  const { corporatePackages, fetchCorporatePackages } = useEventStore()
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [employees, setEmployees] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchCorporatePackages() }, [])

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <Animated.View entering={FadeInDown.springify()} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#09090B', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <CheckCircle2 size={40} color="white" strokeWidth={1.5} />
          </View>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, color: '#09090B', textAlign: 'center' }}>Request Sent!</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#71717A', textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
            Our corporate team will reach out within 24 hours to finalise your event details.
          </Text>
          <View style={{ marginTop: 24, width: '100%', backgroundColor: '#F4F4F5', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E4E4E7' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B' }}>
              {corporatePackages.find((p) => p.id === selectedPkg)?.name ?? 'Package'}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#71717A', marginTop: 4 }}>{company}</Text>
          </View>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}
            style={{ marginTop: 20, width: '100%', backgroundColor: '#09090B', paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: 'white' }}>Back to Home</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    )
  }

  if (showForm && selectedPkg) {
    const pkg = corporatePackages.find((p) => p.id === selectedPkg)!
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
          <Pressable
            onPress={() => setShowForm(false)}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={18} color="#09090B" />
          </Pressable>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#09090B' }}>Request Quote</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Package summary */}
          <View style={{ backgroundColor: '#09090B', borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Selected Package</Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: 'white' }}>{pkg.name}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {pkg.participants} · {pkg.duration}
            </Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: 'white', marginTop: 10 }}>
              {formatCurrency(pkg.price)}
            </Text>
          </View>

          {[
            { label: 'Company Name', value: company, set: setCompany, placeholder: 'e.g. Tata Consultancy Services' },
            { label: 'Contact Person', value: contact, set: setContact, placeholder: 'Your name & phone number' },
            { label: 'Employee Count', value: employees, set: setEmployees, placeholder: 'Approx. participants' },
          ].map(({ label, value, set, placeholder }) => (
            <View key={label} style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#09090B', marginBottom: 6 }}>{label}</Text>
              <TextInput
                value={value}
                onChangeText={set}
                placeholder={placeholder}
                placeholderTextColor="#A1A1AA"
                style={{
                  borderWidth: 1.5, borderColor: value.length > 0 ? '#09090B' : '#E4E4E7',
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  fontFamily: 'Inter_400Regular', fontSize: 14, color: '#09090B',
                }}
              />
            </View>
          ))}

          <View style={{ backgroundColor: '#F4F4F5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4E4E7', marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#52525B' }}>
              Our team will contact you within 24 hours to discuss customisation, dates, and venue options.
            </Text>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F4F4F5' }}>
          <Pressable
            onPress={async () => {
              if (!company || !contact || !selectedPkg) return
              setSubmitting(true)
              const { error } = await (supabase as any).from('corporate_enquiries').insert({
                package_id: selectedPkg,
                company_name: company,
                contact_name: contact,
                contact_phone: contact,
                employee_count: employees || null,
              })
              setSubmitting(false)
              if (error) { toast('Could not submit. Please try again.', 'error'); return }
              setSubmitted(true)
            }}
            disabled={!company || !contact || submitting}
            style={{
              backgroundColor: company && contact ? '#09090B' : '#E4E4E7',
              paddingVertical: 16, borderRadius: 18, alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: company && contact ? 'white' : '#A1A1AA' }}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} color="#09090B" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#09090B' }}>Corporate Events</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#A1A1AA' }}>Team sports days & leagues</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <View style={{ backgroundColor: '#09090B', borderRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Building2 size={20} color="rgba(255,255,255,0.6)" />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Trusted by 200+ companies</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22, color: 'white', lineHeight: 28, marginBottom: 8 }}>
              Build stronger teams{'\n'}through sports
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, marginBottom: 16 }}>
              From one-day team days to full 8-week leagues. We handle everything — venue, equipment, referees, and scoring.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { icon: Users, label: '20–200\nEmployees' },
                { icon: Clock, label: '1 Day–\n8 Weeks' },
              ].map(({ icon: Icon, label }) => (
                <View key={label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Icon size={16} color="rgba(255,255,255,0.5)" />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 16 }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Packages */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#09090B', marginBottom: 14 }}>Choose a Package</Text>
        </View>

        {corporatePackages.map((pkg, i) => (
          <Animated.View key={pkg.id} entering={FadeInDown.delay(i * 80 + 100).springify()}>
            <Pressable
              onPress={() => setSelectedPkg(selectedPkg === pkg.id ? null : pkg.id)}
              style={{
                marginHorizontal: 16, marginBottom: 14,
                borderRadius: 20, borderWidth: 2,
                borderColor: selectedPkg === pkg.id ? '#09090B' : '#E4E4E7',
                backgroundColor: 'white', overflow: 'hidden',
              }}
            >
              {pkg.popular && (
                <View style={{ backgroundColor: '#09090B', paddingVertical: 6, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: 'white' }}>⭐ MOST POPULAR</Text>
                </View>
              )}

              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#09090B' }}>{pkg.name}</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#71717A', marginTop: 4 }}>
                      {pkg.participants} · {pkg.duration}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: '#09090B' }}>{formatCurrency(pkg.price)}</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#A1A1AA' }}>starting from</Text>
                  </View>
                </View>

                {/* Sports pills */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {pkg.sports.map((s) => (
                    <View key={s} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7' }}>
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#52525B' }}>{s}</Text>
                    </View>
                  ))}
                </View>

                {/* Inclusions */}
                <View style={{ gap: 6 }}>
                  {pkg.includes.slice(0, selectedPkg === pkg.id ? undefined : 4).map((item) => (
                    <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={13} color="#09090B" strokeWidth={2} />
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#52525B' }}>{item}</Text>
                    </View>
                  ))}
                  {selectedPkg !== pkg.id && pkg.includes.length > 4 && (
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>
                      +{pkg.includes.length - 4} more inclusions
                    </Text>
                  )}
                </View>

                {selectedPkg === pkg.id && (
                  <Pressable
                    onPress={() => setShowForm(true)}
                    style={{ marginTop: 16, backgroundColor: '#09090B', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: 'white' }}>Get a Quote →</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}
