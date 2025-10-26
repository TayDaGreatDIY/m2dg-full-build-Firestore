
"use client";

// This hook is now deprecated in favor of the more robust `useAuth` hook.
// It is kept for any components that might still reference it during transition.
import { useAuth } from './useAuth';

export function useAuthUser() {
  const { user, loading } = useAuth();
  
  // Provide a fallback user structure to avoid breaking components that expect a non-null user
  const fallbackUser = {
    uid: 'loading...',
    displayName: 'Loading...',
    username: 'loading...',
    avatarURL: '',
    xp: 0,
    winStreak: 0,
    trainingStreak: 0,
    homeCourt: '...',
  };

  return { user: user || fallbackUser, loading };
}
