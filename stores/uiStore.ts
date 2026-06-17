import { create } from 'zustand'

export type AppMode = 'participant' | 'host'

interface UiStore {
  mode: AppMode
  setMode: (m: AppMode) => void
}

// Participant vs Host view toggle (header switch).
export const useUiStore = create<UiStore>((set) => ({
  mode: 'participant',
  setMode: (mode) => set({ mode }),
}))
