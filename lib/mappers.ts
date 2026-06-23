import type { Database } from './database.types'
import type { Event, User, Ticket, LiveMatch, CorporatePackage } from './types'

type EventRow = Database['public']['Tables']['events']['Row']
type TicketRow = Database['public']['Tables']['tickets']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type LiveMatchRow = Database['public']['Tables']['live_matches']['Row']
type LiveUpdateRow = Database['public']['Tables']['live_match_updates']['Row']
type CorporatePackageRow = Database['public']['Tables']['corporate_packages']['Row']
type EventPrizeRow = Database['public']['Tables']['event_prizes']['Row']
type EventRuleRow = Database['public']['Tables']['event_rules']['Row']

export function mapEvent(
  row: EventRow,
  prizes: EventPrizeRow[] = [],
  rules: EventRuleRow[] = [],
): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as Event['category'],
    event_type: row.event_type as Event['event_type'],
    status: row.status as Event['status'],
    banner_color: '#09090B',
    emoji: '',
    date: row.date,
    time: row.time,
    registration_deadline: row.registration_deadline ?? '',
    location: {
      venue_name: row.venue_name,
      address: row.venue_address,
      city: row.city,
      state: row.state,
      lat: (row as any).lat ?? undefined,
      lng: (row as any).lng ?? undefined,
    },
    max_participants: row.max_participants,
    current_participants: row.current_participants,
    team_config: row.team_size_min
      ? { min_players: row.team_size_min, max_players: row.team_size_max ?? row.team_size_min }
      : undefined,
    payment_type: row.entry_fee > 0 ? 'paid' : row.prize_pool > 0 ? 'prize_pool' : 'free',
    entry_fee: row.entry_fee,
    prize_pool: row.prize_pool,
    prizes: prizes.map((p) => ({
      position: p.position,
      label: p.label,
      amount: p.amount,
      description: p.description ?? undefined,
    })),
    escrow_protected: row.escrow_protected,
    skill_level: row.skill_level as Event['skill_level'],
    rules: rules.map((r) => ({ title: r.title, description: r.description })),
    organizer: {
      id: row.organizer_id ?? '',
      name: row.organizer_name,
      bio: '',
      events_hosted: row.organizer_events_hosted,
      rating: row.organizer_rating,
      total_reviews: 0,
      verification_status: row.organizer_verified ? 'verified' : 'unverified',
    },
    created_at: row.created_at,
    equipment_provided: row.equipment_provided,
    refund_policy: row.refund_policy,
  }
}

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username ?? '',
    avatar: row.avatar_url ?? undefined,
    email: '',
    phone: row.phone ?? '',
    city: row.city,
    bio: row.bio,
    sports_interests: (row.sports_interests ?? []) as User['sports_interests'],
    wallet_balance: row.wallet_balance,
    events_participated: row.events_participated,
    events_won: row.events_won,
    total_winnings: row.total_winnings,
    verification_status: row.verification_status as User['verification_status'],
  }
}

export function mapTicket(row: TicketRow, event: Event): Ticket {
  return {
    id: row.id,
    event,
    ticket_number: row.ticket_number,
    registered_at: row.registered_at,
    status: row.status as Ticket['status'],
    amount_paid: row.amount_paid,
    participant_name: row.participant_name,
    team_name: row.team_name ?? undefined,
  }
}

export function mapLiveMatch(
  row: LiveMatchRow,
  updates: LiveUpdateRow[],
  players: any[] = [],
): LiveMatch {
  return {
    id: row.id,
    event_id: row.event_id ?? '',
    title: row.title,
    category: ((row as any).category ?? 'cricket') as LiveMatch['category'],
    team_a: row.team_a,
    team_b: row.team_b,
    score_a: row.score_a,
    score_b: row.score_b,
    status: row.status,
    prize_pool: row.prize_pool,
    viewers: row.viewers,
    updates: updates.map((u) => ({
      time: u.time_label,
      text: u.text,
      type: 'info' as const,
    })),
    players: players
      .map((p) => ({
        player_name: p.player_name,
        team_side: p.team_side as 'a' | 'b',
        score: Number(p.score),
        detail: p.detail ?? '',
        is_active: !!p.is_active,
      }))
      .sort((a, b) => b.score - a.score),
    emoji: row.emoji,
    color: '#09090B',
  }
}

export function mapCorporatePackage(row: CorporatePackageRow): CorporatePackage {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    participants: row.participants,
    duration: row.duration,
    sports: row.sports,
    includes: row.includes,
    popular: row.popular,
  }
}
