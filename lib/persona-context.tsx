"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useProfile } from "./profile-context";
import type { Persona } from "./types";

interface PersonaContextValue {
  persona:       Persona;
  setPersona:    (p: Persona) => void;
}

const PersonaContext = createContext<PersonaContextValue>({
  persona:    "analyst",
  setPersona: () => {},
});

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile } = useProfile();
  const [persona, setPersonaState] = useState<Persona>("analyst");

  // Sync from profile when it loads
  useEffect(() => {
    if (profile?.default_persona) {
      setPersonaState(profile.default_persona);
    }
  }, [profile?.default_persona]);

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    // Persist to Supabase in the background
    updateProfile({ default_persona: p });
  };

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
