import { create } from 'zustand'

export type ToastType = 'info' | 'success' | 'error'

interface ToastStore {
  message: string
  type: ToastType
  visible: boolean
  show: (message: string, type?: ToastType) => void
  hide: () => void
}

// Branded toast — replaces the OS default Alert for info/success/error messages.
export const useToast = create<ToastStore>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  show: (message, type = 'info') => set({ message, type, visible: true }),
  hide: () => set({ visible: false }),
}))

// Convenience for non-component code.
export const toast = (message: string, type: ToastType = 'info') => useToast.getState().show(message, type)
