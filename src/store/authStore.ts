// src/store/authStore.ts
import { create } from 'zustand';
import { AuthUser } from '@/types'; // Import our AuthUser interface

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true, // Start as loading, as we'll check auth status on app load
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, loading: false }),
}));