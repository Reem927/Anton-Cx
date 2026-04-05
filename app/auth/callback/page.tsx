"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Supabase automatically picks up the token from the URL hash/query
    // and exchanges it for a session when we call getSession
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();

      if (error) {
        router.replace("/login?error=auth");
        return;
      }

      // Small delay to ensure cookies are set before redirect
      router.replace("/dashboard");
      router.refresh();
    };

    handleCallback();
  }, [supabase, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F8FC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #E8EBF2",
            borderTopColor: "#2E6BE6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ fontFamily: "Lato, sans-serif", fontSize: "14px", color: "#6A7590" }}>
          Signing you in...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
