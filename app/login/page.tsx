
import Link from "next/link";

export default function LoginPage() {
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
          maxWidth: "520px",
          background: "#FFFFFF",
          border: "0.5px solid #E8EBF2",
          borderRadius: "18px",
          padding: "36px 34px",
          boxShadow: "0 24px 64px rgba(11, 28, 55, 0.08)",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: "26px",
              fontWeight: 800,
              color: "#1B3A6B",
              marginBottom: "12px",
            }}
          >
            Account access
          </div>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: "15px",
              color: "#6A7590",
              lineHeight: 1.8,
              marginBottom: "16px",
            }}
          >
            Anton Cx authentication is not configured yet. This page exists as a placeholder so account actions and logout navigation work consistently.
          </p>
          <div
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: "13px",
              color: "#6A7590",
              background: "#F7F8FC",
              border: "0.5px solid #E8EBF2",
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            <strong style={{ color: "#1B3A6B" }}>Demo note:</strong> Sign out and return to this page after working in the app.
          </div>
        </div>

        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            background: "#2E6BE6",
            color: "#FFFFFF",
            borderRadius: "12px",
            padding: "14px 18px",
            textDecoration: "none",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: "15px",
            fontWeight: 700,
          }}
        >
          Continue to dashboard
        </Link>
      </div>
    </div>
  );
}
