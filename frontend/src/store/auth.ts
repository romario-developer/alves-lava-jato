import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  companyId: string;
  role: string;
};

type AuthPayload = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type AuthState = {
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  setAuth: (payload: AuthPayload) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      accessToken: undefined,
      refreshToken: undefined,
      setAuth: (payload: AuthPayload) =>
        set({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        }),
      logout: () =>
        set({
          user: undefined,
          accessToken: undefined,
          refreshToken: undefined,
        }),
    }),
    {
      name: 'alves-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
