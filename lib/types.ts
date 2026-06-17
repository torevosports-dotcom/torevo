export type EventCategory =
  | 'cricket' | 'football' | 'basketball' | 'badminton' | 'tennis'
  | 'volleyball' | 'kabaddi' | 'table_tennis' | 'swimming' | 'athletics'
  | 'esports' | 'chess' | 'pickleball' | 'boxing' | 'corporate' | 'other'

export type EventType = 'tournament' | 'casual' | 'league' | 'workshop'
export type EventStatus = 'upcoming' | 'live' | 'filling' | 'sold_out' | 'completed' | 'cancelled'
export type PaymentType = 'free' | 'paid' | 'prize_pool'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro' | 'all'

export interface Location {
  venue_name: string
  address: string
  city: string
  state: string
  landmark?: string
  lat?: number
  lng?: number
}

export interface Prize {
  position: number
  label: string
  amount: number
  description?: string
}

export interface TeamConfig {
  min_players: number
  max_players: number
  max_teams?: number
}

export interface EventRule {
  title: string
  description: string
}

export interface Organizer {
  id: string
  name: string
  avatar?: string
  bio: string
  events_hosted: number
  rating: number
  total_reviews: number
  verification_status: VerificationStatus
  phone?: string
  email?: string
}

export interface Event {
  id: string
  title: string
  description: string
  category: EventCategory
  event_type: EventType
  status: EventStatus
  banner_color: string
  emoji: string
  date: string
  time: string
  registration_deadline: string
  location: Location
  max_participants: number
  current_participants: number
  team_config?: TeamConfig
  payment_type: PaymentType
  entry_fee: number
  prize_pool: number
  prizes: Prize[]
  escrow_protected: boolean
  skill_level: SkillLevel
  rules: EventRule[]
  organizer: Organizer
  created_at: string
  age_restriction?: string
  equipment_provided: boolean
  refund_policy: string
}

export interface User {
  id: string
  name: string
  username: string
  avatar?: string
  email: string
  phone: string
  city: string
  bio: string
  sports_interests: EventCategory[]
  wallet_balance: number
  events_participated: number
  events_won: number
  total_winnings: number
  verification_status: VerificationStatus
}

export interface Ticket {
  id: string
  event: Event
  ticket_number: string
  registered_at: string
  status: 'upcoming' | 'completed' | 'cancelled'
  amount_paid: number
  participant_name: string
  team_name?: string
}

export interface PlayerProfile {
  user: User
  level: number
  xp: number
  xp_to_next: number
  win_rate: number
  current_streak: number
  best_streak: number
  sport_stats: SportStat[]
  achievements: Achievement[]
  recent_form: ('W' | 'L' | 'D')[]
  available_days: string[]
  looking_for: string
}

export interface SportStat {
  category: EventCategory
  matches: number
  wins: number
  losses: number
  draws: number
  highlights: Record<string, string>
}

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  unlocked: boolean
  unlocked_at?: string
}

export interface FilterState {
  category: EventCategory | 'all'
  event_type: EventType | 'all'
  city: string
  price_range: [number, number]
  status: EventStatus | 'all'
  skill_level: SkillLevel | 'all'
  free_only: boolean
  has_prize_pool: boolean
  search: string
}

export interface MatchPlayer {
  player_name: string
  team_side: 'a' | 'b'
  score: number
  detail: string
  is_active: boolean
}

export interface LiveMatch {
  id: string
  event_id: string
  title: string
  category: EventCategory
  team_a: string
  team_b: string
  score_a: string
  score_b: string
  status: string
  prize_pool: number
  viewers: number
  updates: LiveUpdate[]
  players?: MatchPlayer[]
  emoji: string
  color: string
}

export interface LiveUpdate {
  time: string
  text: string
  type: 'goal' | 'wicket' | 'point' | 'info'
}

export interface CorporatePackage {
  id: string
  name: string
  price: number
  participants: string
  duration: string
  sports: string[]
  includes: string[]
  popular: boolean
}
