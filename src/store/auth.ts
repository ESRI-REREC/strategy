import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, ArcGISUser } from '@/types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      portalUrl: process.env.NEXT_PUBLIC_ARCGIS_PORTAL_URL || 'https://gisportal.rerec.co.ke/portal',
      _hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),
      setAuth: (token: string, user: ArcGISUser) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'sp-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
