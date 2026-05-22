import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToAuthChanges } from '@/lib/firebase/auth';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  initialize: () => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      set({ user, loading: false });
    });
    return unsubscribe;
  },
}));

// Hook to initialize auth on mount
let initialized = false;
export const useInitializeAuth = () => {
  if (!initialized) {
    initialized = true;
    useAuthStore.getState().initialize();
  }
};
