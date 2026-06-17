import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase as _supabase } from '../lib/supabase'
const supabase = _supabase as any
import { mapProfile } from '../lib/mappers'
import type { User } from '../lib/types'

interface AuthStore {
  session: Session | null
  user: User | null
  initialized: boolean
  loading: boolean

  initialize: () => Promise<void>
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>
  verifyOTP: (phone: string, token: string) => Promise<{ error: string | null; isNewUser: boolean }>
  createProfile: (data: { name: string; username: string; city: string; sports: string[] }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  updateWallet: (amount: number) => void
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  initialized: false,
  loading: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      set({
        session,
        user: profile ? mapProfile(profile) : null,
        initialized: true,
      })
    } else {
      set({ session: null, user: null, initialized: true })
    }

    supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({ session, user: profile ? mapProfile(profile) : null })
      } else if (event === 'SIGNED_OUT') {
        set({ session: null, user: null })
      }
    })
  },

  signInWithPhone: async (phone) => {
    set({ loading: true })
    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    set({ loading: false })
    return { error: error?.message ?? null }
  },

  verifyOTP: async (phone, token) => {
    set({ loading: true })
    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token,
      type: 'sms',
    })
    if (error) {
      set({ loading: false })
      return { error: error.message, isNewUser: false }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user!.id)
      .single()

    set({ session: data.session, user: profile ? mapProfile(profile) : null, loading: false })
    return { error: null, isNewUser: !profile }
  },

  createProfile: async ({ name, username, city, sports }) => {
    const session = get().session
    if (!session) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        name,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        phone: session.user.phone ?? null,
        city,
        sports_interests: sports,
        wallet_balance: 500,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    // Auto-link any events where this number was pre-assigned as umpire.
    if (session.user.phone) {
      await supabase.from('events')
        .update({ umpire_id: session.user.id })
        .eq('umpire_phone', session.user.phone)
        .is('umpire_id', null)
    }
    set({ user: mapProfile(data) })
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },

  updateUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),

  updateWallet: (amount) => {
    set((state) => {
      if (!state.user) return {}
      const newBalance = state.user.wallet_balance + amount
      supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', state.user.id)
        .then(() => {})
      supabase
        .from('wallet_transactions')
        .insert({
          user_id: state.user!.id,
          amount: Math.abs(amount),
          type: amount < 0 ? 'debit' : 'credit',
          description: amount < 0 ? 'Event registration fee' : 'Wallet credit',
        })
        .then(() => {})
      return { user: { ...state.user!, wallet_balance: newBalance } }
    })
  },

  refreshProfile: async () => {
    const session = get().session
    if (!session) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (data) set({ user: mapProfile(data) })
  },
}))
