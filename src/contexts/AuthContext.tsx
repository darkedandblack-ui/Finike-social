"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  subscribeToAuthState,
  getUserProfile,
  ensureUserProfile,
  handleGoogleRedirectResult,
  signOut as firebaseSignOut,
} from "@/lib/firebase/auth";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const userProfile = await getUserProfile(uid);
    setProfile(userProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.uid);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log("=== AUTH CONTEXT INIT ===");
      const redirectUser = await handleGoogleRedirectResult();
      if (redirectUser && mounted && typeof window !== "undefined") {
        console.log("=== REDIRECT USER FOUND ===");
        console.log("Redirect User UID:", redirectUser.uid);
        const userProfile = await getUserProfile(redirectUser.uid);
        console.log("User Profile:", userProfile);
        console.log("Is Onboarded:", userProfile?.isOnboarded);
        window.location.href = userProfile?.isOnboarded ? "/feed/" : "/onboarding/";
        return;
      }
      console.log("=== NO REDIRECT USER ===");
    };

    initAuth();

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      console.log("=== AUTH STATE CHANGED ===");
      console.log("Firebase User:", firebaseUser?.uid ?? "null");
      setUser(firebaseUser);
      if (firebaseUser) {
        console.log("User signed in, ensuring profile...");
        await ensureUserProfile(firebaseUser);
        console.log("Profile ensured, loading profile...");
        await loadProfile(firebaseUser.uid);
        console.log("Profile loaded");
      } else {
        console.log("User signed out");
        setProfile(null);
      }
      setLoading(false);
      console.log("===========================");
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await firebaseSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
