// src/store/appStore.ts
import { create } from 'zustand';

interface AppState {
  // Example: A global notification message
  notification: {
    message: string | null;
    type: 'success' | 'error' | 'info' | null;
  };
  setNotification: (message: string | null, type: 'success' | 'error' | 'info' | null) => void;
  clearNotification: () => void;

  // You can add more global state here as needed, e.g., currently selected Kisan/Vyapari for a transaction form that spans multiple components
}

export const useAppStore = create<AppState>((set) => ({
  notification: { message: null, type: null },
  setNotification: (message, type) => set({ notification: { message, type } }),
  clearNotification: () => set({ notification: { message: null, type: null } }),
}));