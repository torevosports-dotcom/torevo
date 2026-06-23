import { create } from 'zustand'

export type AppMode = 'participant' | 'host'

// Cities Torevo operates in (Playo-style location picker). 'All' = no filter.
export const CITIES = ['All India', 'Hyderabad', 'Mumbai', 'Bengaluru', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur'] as const
export type City = (typeof CITIES)[number]

interface UiStore {
  mode: AppMode
  setMode: (m: AppMode) => void
  city: City
  setCity: (c: City) => void
}

// Participant vs Host view toggle (header switch) + selected city.
export const useUiStore = create<UiStore>((set) => ({
  mode: 'participant',
  setMode: (mode) => set({ mode }),
  city: 'All India',
  setCity: (city) => set({ city }),
}))
