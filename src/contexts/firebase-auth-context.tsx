
import React, { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useFirebaseAuth, UserProfile } from '@/hooks/use-firebase-auth';

interface FirebaseAuthContextProps {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signUp: (email: string, password: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<boolean>;
  logOut: () => Promise<boolean>;
  updateUserProfile: (updates: {
    displayName?: string,
    username?: string,
    bio?: string,
    website?: string,
    location?: string,
    photoFile?: File | null
  }) => Promise<boolean>;
  updateUserInterests: (interests: string[]) => Promise<boolean>;
  updateGhostMode: (enabled: boolean, timer: number) => Promise<boolean>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  updateNotificationSettings: (settings: any) => Promise<boolean>;
  updatePrivacySettings: (settings: any) => Promise<boolean>;
  followUser: (targetUserId: string) => Promise<boolean>;
  unfollowUser: (targetUserId: string) => Promise<boolean>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextProps | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  
  return (
    <FirebaseAuthContext.Provider value={auth}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(FirebaseAuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  
  return context;
}
