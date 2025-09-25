import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, Business } from '@advisor-ai/shared';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

interface BusinessState {
  currentBusiness: Business | null;
  businesses: Business[];
  isLoading: boolean;
  setCurrentBusiness: (business: Business | null) => void;
  setBusinesses: (businesses: Business[]) => void;
  setLoading: (loading: boolean) => void;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Auth store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          }),
        setLoading: (loading) => set({ isLoading: loading }),
        logout: () =>
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    )
  )
);

// Business store
export const useBusinessStore = create<BusinessState>()(
  devtools(
    persist(
      (set) => ({
        currentBusiness: null,
        businesses: [],
        isLoading: false,
        setCurrentBusiness: (business) => set({ currentBusiness: business }),
        setBusinesses: (businesses) => set({ businesses }),
        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: 'business-storage',
        partialize: (state) => ({ currentBusiness: state.currentBusiness }),
      }
    )
  )
);

// UI store
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'light',
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => {
          set({ theme });
          // Update document class for Tailwind dark mode
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        },
      }),
      {
        name: 'ui-storage',
      }
    )
  )
);
