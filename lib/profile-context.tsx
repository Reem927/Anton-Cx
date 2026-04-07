"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase-browser";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  organization: string | null;
  default_persona: "analyst" | "mfr" | "plan";
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  /** Re-fetch profile from server */
  refresh: () => Promise<void>;
  /** Optimistically update local profile + persist to Supabase */
  updateProfile: (fields: Partial<Pick<Profile, "full_name" | "organization" | "default_persona" | "onboarding_completed">>) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refresh: async () => {},
  updateProfile: async () => false,
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const { profile: p } = await res.json();
      setProfile(p ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Re-fetch on auth state change (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const updateProfile = useCallback(
    async (fields: Partial<Pick<Profile, "full_name" | "organization" | "default_persona" | "onboarding_completed">>) => {
      if (!profile) return false;

      // Optimistic update
      setProfile((prev) => (prev ? { ...prev, ...fields } : prev));

      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });

        if (!res.ok) {
          // Revert on failure
          await fetchProfile();
          return false;
        }

        const { profile: updated } = await res.json();
        setProfile(updated);
        return true;
      } catch {
        await fetchProfile();
        return false;
      }
    },
    [profile, fetchProfile]
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh: fetchProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
