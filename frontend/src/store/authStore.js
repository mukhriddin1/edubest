import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login/', credentials);
          set({
            accessToken: data.access,
            refreshToken: data.refresh,
            user: data.user || null,
            isLoading: false,
          });
          if (!data.user) {
            try {
              const profile = await api.get('/auth/profile/');
              set({ user: profile.data });
            } catch (_) {}
          }
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data };
        }
      },

      logout: async () => {
        const refresh = get().refreshToken;
        try {
          if (refresh) await api.post('/auth/logout/', { refresh });
        } catch (_) {}
        set({ user: null, accessToken: null, refreshToken: null });
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get('/auth/profile/');
          set({ user: data });
        } catch (_) {}
      },

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'edubest-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
