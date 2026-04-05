"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePersona } from "@/lib/persona-context";
import type { Persona } from "@/lib/types";

const MOCK_USER = {
  name:         "Anton Rx",
  email:        "admin@antonrx.com",
  organization: "Anton Rx LLC",
  role:         "Admin",
  joined:       "January 2025",
};

const SECTIONS = [
  { id: "profile",  label: "Account Profile" },
  { id: "account",  label: "Settings" },
  { id: "security", label: "Security" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

const PERSONA_OPTIONS: { value: Persona; label: string; description: string }[] = [
  { value: "analyst", label: "Analyst",      description: "Full platform — PA criteria, diffs, cross-payer compare" },
  { value: "mfr",     label: "Manufacturer", description: "Drug access + market position, competitive intel" },
  { value: "plan",    label: "Health Plan",  description: "Benchmark only — peer rank, variance flags" },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#6A7590" }}>Loading settings...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const searchParams              = useSearchParams();
  const router                    = useRouter();
  const initialSection            = (searchParams.get("section") as SectionId | null) ?? "profile";
  const [section, setSection]     = useState<SectionId>(initialSection);
  const { persona, setPersona }   = usePersona();

  const [name,  setName]  = useState(MOCK_USER.name);
  const [org,   setOrg]   = useState(MOCK_USER.organization);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  function save(sectionId: string) {
    setSaved(sectionId);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: "940px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontSize:   "28px",
            fontWeight: 800,
            color:      "#1B3A6B",
            margin:     0,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            marginTop:   "10px",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize:   "14px",
            lineHeight: 1.7,
            color:      "#6A7590",
            maxWidth:   "680px",
          }}
        >
          Manage your account profile, default persona, security preferences, and session actions in one place.
        </p>
      </div>

      <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
        {/* Left nav */}
        <aside
          style={{
            width:       "220px",
            flexShrink:  0,
            background:  "#FFFFFF",
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: "#E8EBF2",
            borderRadius: "14px",
            padding:     "18px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize:   "12px",
              fontWeight: 600,
              color:      "#1B3A6B",
              marginBottom: "14px",
            }}
          >
            Settings sections
          </div>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setSection(s.id);
                router.replace(`/settings?section=${s.id}`);
              }}
              style={{
                display:      "block",
                width:        "100%",
                textAlign:    "left",
                padding:      "12px 14px",
                borderRadius: "12px",
                border:       "none",
                background:   section === s.id ? "#EBF0FC" : "transparent",
                fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize:     "13px",
                fontWeight:   section === s.id ? 600 : 500,
                color:        section === s.id ? "#1B3A6B" : "#6A7590",
                cursor:       "pointer",
                marginBottom: "10px",
                transition:   "background 120ms, color 120ms",
              }}
            >
              {s.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {section === "profile" && (
            <SettingsCard
              title="Account Profile"
              subtitle="Your name, organization, and account details."
              onSave={() => save("profile")}
              saved={saved === "profile"}
            >
              <FieldRow label="Display name">
                <TextInput value={name} onChange={setName} />
              </FieldRow>
              <FieldRow label="Email address">
                <TextInput value={MOCK_USER.email} disabled />
              </FieldRow>
              <FieldRow label="Organization">
                <TextInput value={org} onChange={setOrg} />
              </FieldRow>
              <FieldRow label="Role" last>
                <span
                  style={{
                    fontFamily:   "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize:     "11px",
                    color:        "#1B3A6B",
                    background:   "#EBF0FC",
                    borderWidth:  "0.5px",
                    borderStyle:  "solid",
                    borderColor:  "#C4D4F8",
                    borderRadius: "6px",
                    padding:      "5px 10px",
                  }}
                >
                  {MOCK_USER.role}
                </span>
              </FieldRow>
            </SettingsCard>
          )}

          {section === "account" && (
            <SettingsCard
              title="Settings"
              onSave={() => save("account")}
              saved={saved === "account"}
            >
              <FieldRow label="Default persona">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  {PERSONA_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      style={{
                        display:      "flex",
                        alignItems:   "flex-start",
                        gap:          "10px",
                        padding:      "10px 12px",
                        borderRadius: "8px",
                        borderWidth:  persona === opt.value ? "1.5px" : "0.5px",
                        borderStyle:  "solid",
                        borderColor:  persona === opt.value ? "#2E6BE6" : "#E8EBF2",
                        background:   persona === opt.value ? "#F5F8FF" : "#FFFFFF",
                        cursor:       "pointer",
                        transition:   "all 100ms",
                      }}
                    >
                      <input
                        type="radio"
                        name="persona"
                        value={opt.value}
                        checked={persona === opt.value}
                        onChange={() => setPersona(opt.value)}
                        style={{ marginTop: "2px", accentColor: "#2E6BE6" }}
                      />
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                            fontSize:   "13px",
                            fontWeight: 600,
                            color:      "#0D1C3A",
                          }}
                        >
                          {opt.label}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                            fontSize:   "12px",
                            color:      "#9AA3BB",
                            marginTop:  "2px",
                          }}
                        >
                          {opt.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </FieldRow>
              <FieldRow label="Member since" last>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize:   "12px",
                    color:      "#9AA3BB",
                  }}
                >
                  {MOCK_USER.joined}
                </span>
              </FieldRow>
            </SettingsCard>
          )}

          {section === "security" && (
            <>
              <SettingsCard title="Password" onSave={() => save("password")} saved={saved === "password"} saveLabel="Update password">
                <FieldRow label="Current password">
                  <TextInput value="" onChange={() => {}} type="password" placeholder="Enter current password" />
                </FieldRow>
                <FieldRow label="New password">
                  <TextInput value="" onChange={() => {}} type="password" placeholder="Enter new password" />
                </FieldRow>
                <FieldRow label="Confirm password" last>
                  <TextInput value="" onChange={() => {}} type="password" placeholder="Confirm new password" />
                </FieldRow>
              </SettingsCard>

              <SettingsCard title="Active sessions" hideSave style={{ marginTop: "16px" }}>
                <FieldRow label="Current session" last>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                        fontSize:   "13px",
                        color:      "#0D1C3A",
                      }}
                    >
                      This device
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                        fontSize:   "11px",
                        color:      "#9AA3BB",
                        marginTop:  "2px",
                      }}
                    >
                      Active now
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily:   "var(--font-dm-mono), 'DM Mono', monospace",
                      fontSize:     "10px",
                      color:        "#0F7A40",
                      background:   "#EDFAF3",
                      borderWidth:  "0.5px",
                      borderStyle:  "solid",
                      borderColor:  "#B8EDD0",
                      borderRadius: "4px",
                      padding:      "2px 7px",
                    }}
                  >
                    ACTIVE
                  </span>
                </FieldRow>
              </SettingsCard>
            </>
          )}

          <div style={{ marginTop: "24px" }}>
            <SettingsCard title="Session" hideSave>
              <FieldRow label="Sign out" last>
                <button
                  onClick={() => router.push("/")}
                  style={{
                    fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize:     "13px",
                    fontWeight:   600,
                    color:        "#B02020",
                    background:   "#FFF4F4",
                    border:       "1px solid #F5C0C0",
                    borderRadius: "8px",
                    padding:      "10px 16px",
                    cursor:       "pointer",
                  }}
                >
                  Log out
                </button>
              </FieldRow>
            </SettingsCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsCard({
  title, subtitle, children, onSave, saved, saveLabel, hideSave, style: extraStyle,
}: {
  title:      string;
  subtitle?:  string;
  children:   React.ReactNode;
  onSave?:    () => void;
  saved?:     boolean;
  saveLabel?: string;
  hideSave?:  boolean;
  style?:     React.CSSProperties;
}) {
  return (
    <div
      style={{
        background:   "#FFFFFF",
        borderWidth:  "0.5px",
        borderStyle:  "solid",
        borderColor:  "#E8EBF2",
        borderRadius: "16px",
        overflow:     "hidden",
        ...extraStyle,
      }}
    >
      <div
        style={{
          padding:      "20px 24px",
          borderBottom: "0.5px solid #E8EBF2",
          background:   "#FAFBFD",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                fontFamily: "var(--font-syne), Syne, sans-serif",
                fontSize:   "15px",
                fontWeight: 700,
                color:      "#1B3A6B",
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  marginTop: "6px",
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize:   "13px",
                  color:      "#6A7590",
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ padding: "4px 0" }}>{children}</div>

      {!hideSave && (
        <div
          style={{
            padding:     "12px 20px",
            borderTop:   "0.5px solid #E8EBF2",
            display:     "flex",
            alignItems:  "center",
            justifyContent: "flex-end",
            gap:         "10px",
          }}
        >
          {saved && (
            <span
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize:   "12px",
                color:      "#0F7A40",
              }}
            >
              Saved
            </span>
          )}
          <button
            onClick={onSave}
            style={{
              fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize:     "13px",
              fontWeight:   500,
              color:        "#FFFFFF",
              background:   "#2E6BE6",
              border:       "none",
              borderRadius: "7px",
              padding:      "7px 16px",
              cursor:       "pointer",
              transition:   "background 100ms",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1B5ACC"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#2E6BE6"; }}
          >
            {saveLabel ?? "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  label, children, last,
}: {
  label:    string;
  children: React.ReactNode;
  last?:    boolean;
}) {
  return (
    <div
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "16px",
        padding:       "14px 20px",
        borderBottom:  last ? "none" : "0.5px solid #E8EBF2",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize:   "13px",
          color:      "#6A7590",
          width:      "148px",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, disabled, type = "text", placeholder,
}: {
  value:       string;
  onChange?:   (v: string) => void;
  disabled?:   boolean;
  type?:       string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      style={{
        flex:         1,
        background:   disabled ? "#F7F8FC" : "#FFFFFF",
        borderWidth:  "0.5px",
        borderStyle:  "solid",
        borderColor:  "#E8EBF2",
        borderRadius: "7px",
        padding:      "7px 12px",
        fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
        fontSize:     "13px",
        color:        disabled ? "#9AA3BB" : "#0D1C3A",
        outline:      "none",
        cursor:       disabled ? "not-allowed" : "text",
      }}
    />
  );
}
