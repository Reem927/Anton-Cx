"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TopBar } from "@/components/shell/TopBar";
import { Sidebar } from "@/components/shell/Sidebar";
import { PersonaProvider, usePersona } from "@/lib/persona-context";


const SIDEBAR_KEY = "anton-cx-sidebar";

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { persona, setPersona } = usePersona();

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) setSidebarExpanded(stored === "true");
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => {
      localStorage.setItem(SIDEBAR_KEY, String(!prev));
      return !prev;
    });
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <TopBar
        onSidebarToggle={toggleSidebar}
        sidebarExpanded={sidebarExpanded}
        persona={persona}
        onPersonaChange={setPersona}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          expanded={sidebarExpanded}
          onToggle={toggleSidebar}
        />
        <main className="flex-1 overflow-auto" style={{ background: "#F7F8FC" }}>
          {/* Persona cross-fade */}
          <AnimatePresence mode="wait">
            <motion.div
              key={persona}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ minHeight: "100%" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonaProvider>
      <AppShell>{children}</AppShell>
    </PersonaProvider>
  );
}
