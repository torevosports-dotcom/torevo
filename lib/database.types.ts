export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          username: string | null
          phone: string | null
          city: string
          bio: string
          avatar_url: string | null
          wallet_balance: number
          events_participated: number
          events_won: number
          total_winnings: number
          sports_interests: string[]
          verification_status: string
          level: number
          xp: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          event_type: string
          status: string
          date: string
          time: string
          registration_deadline: string | null
          venue_name: string
          venue_address: string
          city: string
          state: string
          max_participants: number
          current_participants: number
          team_size_min: number | null
          team_size_max: number | null
          entry_fee: number
          prize_pool: number
          escrow_protected: boolean
          skill_level: string
          refund_policy: string
          equipment_provided: boolean
          organizer_id: string | null
          organizer_name: string
          organizer_rating: number
          organizer_events_hosted: number
          organizer_verified: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['events']['Row']>
      }
      event_prizes: {
        Row: {
          id: string
          event_id: string
          position: number
          label: string
          amount: number
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_prizes']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['event_prizes']['Row']>
      }
      event_rules: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_rules']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['event_rules']['Row']>
      }
      tickets: {
        Row: {
          id: string
          event_id: string
          user_id: string
          ticket_number: string
          status: string
          amount_paid: number
          participant_name: string
          team_name: string | null
          payment_method: string
          razorpay_payment_id: string | null
          razorpay_order_id: string | null
          registered_at: string
          cancelled_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'registered_at'> & { id?: string; registered_at?: string }
        Update: Partial<Database['public']['Tables']['tickets']['Row']>
      }
      live_matches: {
        Row: {
          id: string
          event_id: string | null
          title: string
          emoji: string
          status: string
          team_a: string
          team_b: string
          score_a: string
          score_b: string
          prize_pool: number
          viewers: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['live_matches']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['live_matches']['Row']>
      }
      live_match_updates: {
        Row: {
          id: string
          match_id: string
          time_label: string
          text: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['live_match_updates']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['live_match_updates']['Row']>
      }
      corporate_packages: {
        Row: {
          id: string
          name: string
          participants: string
          duration: string
          price: number
          sports: string[]
          includes: string[]
          popular: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['corporate_packages']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['corporate_packages']['Row']>
      }
      corporate_enquiries: {
        Row: {
          id: string
          package_id: string
          company_name: string
          contact_name: string
          contact_phone: string
          employee_count: string | null
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['corporate_enquiries']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['corporate_enquiries']['Row']>
      }
      player_profiles: {
        Row: {
          id: string
          user_id: string | null
          name: string
          sport: string
          skill_level: string
          city: string
          rating: number
          events_count: number
          looking_for: string
          available: string
          verified: boolean
          visible: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['player_profiles']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['player_profiles']['Row']>
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          description: string
          reference_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['wallet_transactions']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['wallet_transactions']['Row']>
      }
    }
  }
}
