import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useEventsStore = create((set) => ({
  events: [],
  featuredEvents: [],
  trendingEvents: [],
  filters: {
    search: '',
    type: '',
    eligibility: '',
    startDate: '',
    endDate: '',
  },
  
  setEvents: (events) => set({ events }),
  setFeaturedEvents: (featuredEvents) => set({ featuredEvents }),
  setTrendingEvents: (trendingEvents) => set({ trendingEvents }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  clearFilters: () => set({ 
    filters: {
      search: '',
      type: '',
      eligibility: '',
      startDate: '',
      endDate: '',
    }
  }),
}));

export const useUIStore = create((set) => ({
  isLoading: false,
  isMobileMenuOpen: false,
  
  setLoading: (isLoading) => set({ isLoading }),
  toggleMobileMenu: () => set((state) => ({ 
    isMobileMenuOpen: !state.isMobileMenuOpen 
  })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
