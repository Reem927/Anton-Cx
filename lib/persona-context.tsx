"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { Persona } from "./types";

interface PersonaContextValue {
  persona:       Persona;
  setPersona:    (p: Persona) => void;
}

const PersonaContext = createContext<PersonaContextValue>({
  persona:    "analyst",
  setPersona: () => {},
});

const PERSONA_KEY = "anton-cx-persona";

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>("analyst");

  useEffect(() => {
    const stored = sessionStorage.getItem(PERSONA_KEY) as Persona | null;
    if (stored && ["analyst", "mfr", "plan"].includes(stored)) {
      setPersonaState(stored);
    }
  }, []);

  const setPersona = (p: Persona) => {
    sessionStorage.setItem(PERSONA_KEY, p);
    setPersonaState(p);
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
