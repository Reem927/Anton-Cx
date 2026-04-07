"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setInfo("Account created! Check your email to confirm, then sign in.");
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Ensure profile exists (handles pre-trigger users)
    try { await fetch("/api/profile"); } catch {}

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F8FC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#FFFFFF",
          border: "0.5px solid #E8EBF2",
          borderRadius: "18px",
          padding: "36px 34px",
          boxShadow: "0 24px 64px rgba(11, 28, 55, 0.08)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "Lato, sans-serif",
              fontSize: "26px",
              fontWeight: 900,
              color: "#1B3A6B",
              marginBottom: "8px",
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontFamily: "Lato, sans-serif", fontSize: "14px", color: "#6A7590" }}>
            Sign in to Anton Cx
          </p>
        </div>

        {/* Info banner */}
        {info && (
          <div
            style={{
              background: "#EDFAF3",
              border: "0.5px solid #B8EDD0",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "18px",
              fontFamily: "Lato, sans-serif",
              fontSize: "13px",
              color: "#0F7A40",
            }}
          >
            {info}
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "0.5px solid #E8EBF2",
            background: "#FFFFFF",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Lato, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#0D1C3A",
            transition: "border-color 100ms",
            marginBottom: "20px",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2E6BE6"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E8EBF2"; }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "0.5px", background: "#E8EBF2" }} />
          <span style={{ fontFamily: "Lato, sans-serif", fontSize: "11px", color: "#A0AABB", letterSpacing: "0.08em" }}>OR</span>
          <div style={{ flex: 1, height: "0.5px", background: "#E8EBF2" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "#FEE8E8",
                border: "0.5px solid #F5C0C0",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "14px",
                fontFamily: "Lato, sans-serif",
                fontSize: "13px",
                color: "#B02020",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: !loading && email && password ? "#2E6BE6" : "#C4D4F8",
              color: "#FFFFFF",
              fontFamily: "Lato, sans-serif",
              fontSize: "15px",
              fontWeight: 700,
              cursor: !loading && email && password ? "pointer" : "not-allowed",
              transition: "background 100ms",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: "20px", fontFamily: "Lato, sans-serif", fontSize: "13px", color: "#6A7590" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#2E6BE6", textDecoration: "none", fontWeight: 600 }}>
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "Lato, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  color: "#0D1C3A",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "0.5px solid #E8EBF2",
  background: "#FFFFFF",
  fontFamily: "Lato, sans-serif",
  fontSize: "14px",
  color: "#0D1C3A",
  outline: "none",
  boxSizing: "border-box",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.48h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
