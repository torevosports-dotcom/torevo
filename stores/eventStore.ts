// @ts-nocheck
import { create } from 'zustand'
import { supabase as _supabase } from '../lib/supabase'
const supabase = _supabase as any
import { mapEvent, mapTicket, mapLiveMatch, mapCorporatePackage } from '../lib/mappers'
import { mockEvents, mockLiveMatches, mockCorporatePackages } from '../lib/mockData'
import type { Event, Ticket, FilterState, LiveMatch, CorporatePackage } from '../lib/types'

const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

interface EventStore {
  events: Event[]
  tickets: Ticket[]
  liveMatches: LiveMatch[]
  myScores: any[]
  corporatePackages: CorporatePackage[]
  filters: FilterState
  loading: boolean
  ticketsLoading: boolean

  hostedEvents: any[]

  fetchEvents: () => Promise<void>
  fetchTickets: (userId: string) => Promise<void>
  fetchLiveMatches: () => Promise<void>
  fetchMyScores: (userId: string) => Promise<void>

  umpiringEvents: any[]

  // ── Host / Scorer ──
  fetchHostedEvents: (userId: string) => Promise<void>
  fetchUmpiringEvents: (userId: string) => Promise<void>
  assignUmpire: (eventId: string, phone: string) => Promise<{ linked: boolean }>
  getOrCreateMatch: (event: any) => Promise<any>
  saveMatch: (matchId: string, fields: any) => Promise<void>
  listMatchPlayers: (matchId: string) => Promise<any[]>
  addMatchPlayer: (matchId: string, p: { name: string; phone?: string; team_side: 'a' | 'b' }) => Promise<any>
  bumpPlayer: (rowId: string, score: number, detail: string, stats?: any) => Promise<void>
  postCommentary: (matchId: string, timeLabel: string, text: string) => Promise<void>

  // ── Team rosters ──
  saveTeamMembers: (ticketId: string, members: { name: string; phone: string }[]) => Promise<void>
  fetchTeamMembers: (ticketId: string) => Promise<any[]>
  getMyTicketForEvent: (eventId: string, userId: string) => Promise<any>
  fetchCorporatePackages: () => Promise<void>
  subscribeToLiveMatches: () => () => void

  setFilter: (key: keyof FilterState, value: any) => void
  resetFilters: () => void
  filteredEvents: () => Event[]

  registerForEvent: (eventId: string, ticket: Ticket) => void
  cancelTicket: (ticketId: string, userId: string) => Promise<void>
  createTicketInDB: (params: {
    eventId: string
    userId: string
    participantName: string
    teamName?: string
    amountPaid: number
    paymentMethod: string
    razorpayPaymentId?: string
    razorpayOrderId?: string
  }) => Promise<{ ticket: Ticket | null; error: string | null; walletDebited: boolean }>
}

const defaultFilters: FilterState = {
  category: 'all',
  event_type: 'all',
  city: '',
  price_range: [0, 10000],
  status: 'all',
  skill_level: 'all',
  free_only: false,
  has_prize_pool: false,
  search: '',
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 90000 + 10000)
  return `TGO-${year}${month}-${rand}`
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  tickets: [],
  liveMatches: [],
  myScores: [],
  hostedEvents: [],
  umpiringEvents: [],
  corporatePackages: [],
  filters: defaultFilters,
  loading: false,
  ticketsLoading: false,

  fetchEvents: async () => {
    set({ loading: true })
    if (IS_DEMO) {
      set({ events: mockEvents, loading: false })
      return
    }
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (error || !eventsData) {
      set({ events: mockEvents, loading: false })
      return
    }

    const eventIds = eventsData.map((e) => e.id)
    const [{ data: prizesData }, { data: rulesData }] = await Promise.all([
      supabase.from('event_prizes').select('*').in('event_id', eventIds),
      supabase.from('event_rules').select('*').in('event_id', eventIds).order('sort_order'),
    ])

    const events = eventsData.map((row) =>
      mapEvent(
        row,
        prizesData?.filter((p) => p.event_id === row.id) ?? [],
        rulesData?.filter((r) => r.event_id === row.id) ?? [],
      )
    )
    set({ events, loading: false })
  },

  fetchTickets: async (userId) => {
    set({ ticketsLoading: true })
    const { data: ticketRows } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false })

    if (!ticketRows) {
      set({ ticketsLoading: false })
      return
    }

    const eventIds = [...new Set(ticketRows.map((t) => t.event_id))]
    const { data: eventsData } = await supabase.from('events').select('*').in('id', eventIds)
    const { data: prizesData } = await supabase.from('event_prizes').select('*').in('event_id', eventIds)
    const { data: rulesData } = await supabase.from('event_rules').select('*').in('event_id', eventIds)

    const tickets = ticketRows.map((row) => {
      const eventRow = eventsData?.find((e) => e.id === row.event_id)
      if (!eventRow) return null
      const event = mapEvent(
        eventRow,
        prizesData?.filter((p) => p.event_id === eventRow.id) ?? [],
        rulesData?.filter((r) => r.event_id === eventRow.id) ?? [],
      )
      return mapTicket(row, event)
    }).filter(Boolean) as Ticket[]

    set({ tickets, ticketsLoading: false })
  },

  fetchLiveMatches: async () => {
    if (IS_DEMO) { set({ liveMatches: mockLiveMatches }); return }
    const { data: matches } = await supabase
      .from('live_matches')
      .select('*')
      .eq('is_live', true)
      .order('viewers', { ascending: false })

    if (!matches) return

    const matchIds = matches.map((m) => m.id)
    const [{ data: updates }, { data: players }] = await Promise.all([
      supabase
        .from('live_match_updates')
        .select('*')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('match_players')
        .select('*')
        .in('match_id', matchIds)
        .order('sort_order', { ascending: true }),
    ])

    const liveMatches = matches.map((m) =>
      mapLiveMatch(
        m,
        updates?.filter((u) => u.match_id === m.id) ?? [],
        players?.filter((p) => p.match_id === m.id) ?? [],
      )
    )
    set({ liveMatches })
  },

  // Personal score history for the Profile screen — this user's individual
  // stat lines across all matches (joined to the match for context).
  fetchMyScores: async (userId) => {
    const { data } = await supabase
      .from('match_players')
      .select('score, detail, team_side, stats, updated_at, live_matches(title, category, emoji, team_a, team_b, status)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (!data) return
    const myScores = data.map((r: any) => ({
      match_title: r.live_matches?.title ?? '',
      category: r.live_matches?.category ?? 'other',
      emoji: r.live_matches?.emoji ?? '🏆',
      team: r.team_side === 'a' ? r.live_matches?.team_a : r.live_matches?.team_b,
      status: r.live_matches?.status ?? '',
      score: Number(r.score),
      detail: r.detail ?? '',
      stats: r.stats ?? {},
    }))
    set({ myScores })
  },

  // ── Host / Scorer ───────────────────────────────────────────────────────
  fetchHostedEvents: async (userId) => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)
      .order('date', { ascending: true })
    if (data) set({ hostedEvents: data.map((r: any) => ({ ...mapEvent(r, [], []), umpire_phone: r.umpire_phone, umpire_id: r.umpire_id })) })
  },

  fetchUmpiringEvents: async (userId) => {
    const { data } = await supabase
      .from('events').select('*').eq('umpire_id', userId).order('date', { ascending: true })
    if (data) set({ umpiringEvents: data.map((r: any) => mapEvent(r, [], [])) })
  },

  // Assign an umpire by phone — links to their account if one exists with that number.
  assignUmpire: async (eventId, phone) => {
    const clean = phone.trim()
    let umpireId: string | null = null
    if (clean) {
      const { data: prof } = await supabase.from('profiles').select('id').eq('phone', clean).maybeSingle()
      umpireId = prof?.id ?? null
    }
    await supabase.from('events').update({ umpire_id: umpireId, umpire_phone: clean || null }).eq('id', eventId)
    return { linked: !!umpireId }
  },

  // Get the existing live match for an event, or create one.
  getOrCreateMatch: async (event) => {
    const { data: existing } = await supabase
      .from('live_matches').select('*').eq('event_id', event.id).maybeSingle()
    if (existing) return existing
    const { data: created } = await supabase
      .from('live_matches')
      .insert({
        event_id: event.id,
        category: event.category,
        title: event.title,
        emoji: '🏆',
        status: 'Live',
        team_a: 'Team A',
        team_b: 'Team B',
        score_a: '0',
        score_b: '0',
        prize_pool: event.prize_pool ?? 0,
        viewers: 0,
        is_live: true,
      })
      .select().single()
    return created
  },

  saveMatch: async (matchId, fields) => {
    await supabase.from('live_matches').update(fields).eq('id', matchId)
  },

  listMatchPlayers: async (matchId) => {
    const { data } = await supabase
      .from('match_players').select('*').eq('match_id', matchId)
      .order('team_side').order('sort_order')
    return data ?? []
  },

  // Add a player to a match — upserts the phone-keyed directory entry first.
  addMatchPlayer: async (matchId, p) => {
    let playerId: string | null = null
    if (p.phone) {
      const { data: existing } = await supabase
        .from('players').select('id').eq('phone', p.phone).maybeSingle()
      if (existing) {
        playerId = existing.id
      } else {
        const { data: np } = await supabase
          .from('players').insert({ phone: p.phone, name: p.name }).select('id').single()
        playerId = np?.id ?? null
      }
    }
    const { data: row } = await supabase
      .from('match_players')
      .insert({
        match_id: matchId,
        player_id: playerId,
        team_side: p.team_side,
        player_name: p.name,
        score: 0,
        detail: '',
        stats: {},
        is_active: false,
        sort_order: 0,
      })
      .select().single()
    return row
  },

  bumpPlayer: async (rowId, score, detail, stats) => {
    const patch: any = { score, detail, updated_at: new Date().toISOString() }
    if (stats) patch.stats = stats
    await supabase.from('match_players').update(patch).eq('id', rowId)
  },

  postCommentary: async (matchId, timeLabel, text) => {
    await supabase.from('live_match_updates').insert({ match_id: matchId, time_label: timeLabel, text })
  },

  // ── Team rosters ──────────────────────────────────────────────────────────
  // Replace a ticket's roster: upsert each member into the phone-keyed players
  // directory, then rewrite ticket_members. Stats later key off player_id/phone.
  saveTeamMembers: async (ticketId, members) => {
    await supabase.from('ticket_members').delete().eq('ticket_id', ticketId)
    for (const m of members) {
      const name = (m.name ?? '').trim()
      if (!name) continue
      const phone = (m.phone ?? '').trim()
      let playerId: string | null = null
      if (phone) {
        const { data: ex } = await supabase.from('players').select('id').eq('phone', phone).maybeSingle()
        if (ex) playerId = ex.id
        else {
          const { data: np } = await supabase.from('players').insert({ phone, name }).select('id').single()
          playerId = np?.id ?? null
        }
      }
      await supabase.from('ticket_members').insert({ ticket_id: ticketId, name, phone: phone || null, player_id: playerId })
    }
  },

  fetchTeamMembers: async (ticketId) => {
    const { data } = await supabase.from('ticket_members').select('*').eq('ticket_id', ticketId).order('created_at')
    return data ?? []
  },

  getMyTicketForEvent: async (eventId, userId) => {
    const { data } = await supabase
      .from('tickets').select('*')
      .eq('event_id', eventId).eq('user_id', userId).neq('status', 'cancelled')
      .maybeSingle()
    return data
  },

  fetchCorporatePackages: async () => {
    if (IS_DEMO) { set({ corporatePackages: mockCorporatePackages }); return }
    const { data } = await supabase
      .from('corporate_packages')
      .select('*')
      .order('price', { ascending: true })
    if (data) set({ corporatePackages: data.map(mapCorporatePackage) })
  },

  subscribeToLiveMatches: () => {
    const channel = supabase
      .channel('live_matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_matches' }, () => {
        get().fetchLiveMatches()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_match_updates' }, () => {
        get().fetchLiveMatches()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_players' }, () => {
        get().fetchLiveMatches()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  resetFilters: () => set({ filters: defaultFilters }),

  filteredEvents: () => {
    const { events, filters } = get()
    return events.filter((e) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!e.title.toLowerCase().includes(q) && !e.location.city.toLowerCase().includes(q)) return false
      }
      if (filters.category !== 'all' && e.category !== filters.category) return false
      if (filters.event_type !== 'all' && e.event_type !== filters.event_type) return false
      if (filters.status !== 'all' && e.status !== filters.status) return false
      if (filters.skill_level !== 'all' && e.skill_level !== filters.skill_level && e.skill_level !== 'all') return false
      if (filters.city && !e.location.city.toLowerCase().includes(filters.city.toLowerCase())) return false
      if (filters.free_only && e.entry_fee > 0) return false
      if (filters.has_prize_pool && e.prize_pool === 0) return false
      if (e.entry_fee < filters.price_range[0] || e.entry_fee > filters.price_range[1]) return false
      return true
    })
  },

  registerForEvent: (eventId, ticket) =>
    set((state) => ({
      tickets: [ticket, ...state.tickets],
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, current_participants: e.current_participants + 1 } : e
      ),
    })),

  cancelTicket: async (ticketId, userId) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('user_id', userId)

    if (!error) {
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === ticketId ? { ...t, status: 'cancelled' as const } : t
        ),
      }))
    }
  },

  createTicketInDB: async ({
    eventId, userId, participantName, teamName,
    amountPaid, paymentMethod, razorpayPaymentId, razorpayOrderId,
  }) => {
    const event = get().events.find((e) => e.id === eventId)
    if (!event) return { ticket: null, error: 'Event not found', walletDebited: false }

    // ── Preferred path: atomic register_for_event RPC (migration 002) ──
    // Handles capacity + duplicate + wallet debit + count + escrow in one txn.
    const rpc = await supabase.rpc('register_for_event', {
      p_event_id: eventId,
      p_participant_name: participantName,
      p_team_name: teamName ?? null,
      p_payment_method: paymentMethod,
      p_razorpay_payment_id: razorpayPaymentId ?? null,
      p_razorpay_order_id: razorpayOrderId ?? null,
    })

    if (!rpc.error && rpc.data) {
      const { data: row } = await supabase.from('tickets').select('*').eq('id', rpc.data).single()
      if (row) {
        // RPC already debited the wallet server-side for paid wallet payments.
        const walletDebited = paymentMethod === 'wallet' && event.entry_fee > 0
        return { ticket: mapTicket(row, event), error: null, walletDebited }
      }
    }

    if (rpc.error) {
      const msg = rpc.error.message || ''
      const fnMissing = rpc.error.code === 'PGRST202' || rpc.error.code === '42883' ||
        /function .*register_for_event.* does not exist/i.test(msg) || /Not authenticated/i.test(msg)
      // Real business errors → surface to the user, do not fall through.
      if (!fnMissing) {
        const friendly = /sold out/i.test(msg) ? 'This event is sold out.'
          : /already registered/i.test(msg) ? 'You are already registered for this event.'
          : /registration is closed/i.test(msg) ? 'Registration for this event is closed.'
          : /insufficient/i.test(msg) ? 'Insufficient wallet balance.'
          : msg
        return { ticket: null, error: friendly, walletDebited: false }
      }
      // else: RPC not deployed / no real session yet → legacy fallback below.
    }

    // ── Legacy fallback: direct insert (non-atomic) ──
    const { data: existing } = await supabase
      .from('tickets').select('id')
      .eq('event_id', eventId).eq('user_id', userId).neq('status', 'cancelled')
      .maybeSingle()
    if (existing) return { ticket: null, error: 'You are already registered for this event.', walletDebited: false }

    const { data: ev } = await supabase
      .from('events').select('current_participants, max_participants').eq('id', eventId).single()
    if (ev && ev.current_participants >= ev.max_participants) {
      return { ticket: null, error: 'This event is sold out.', walletDebited: false }
    }

    const ticketNumber = generateTicketNumber()
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        event_id: eventId,
        user_id: userId,
        ticket_number: ticketNumber,
        status: 'upcoming',
        amount_paid: amountPaid,
        participant_name: participantName,
        team_name: teamName ?? null,
        payment_method: paymentMethod,
        razorpay_payment_id: razorpayPaymentId ?? null,
        razorpay_order_id: razorpayOrderId ?? null,
      })
      .select()
      .single()

    if (error) return { ticket: null, error: error.message, walletDebited: false }

    await supabase.rpc('increment_event_participants', { event_id: eventId })
    return { ticket: mapTicket(data, event), error: null, walletDebited: false }
  },
}))
