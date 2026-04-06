// Known payer abbreviations — expand as new payers are ingested
export const PAYER_ABBR: Record<string, string> = {
  aetna:              "AETNA",
  uhc:                "UHC",
  unitedealthcare:    "UHC",
  cigna:              "CIGNA",
  "bcbs-tx":          "BCBS TX",
  "bcbs-fl":          "BCBS FL",
  "bcbs-il":          "BCBS IL",
  humana:             "HUMANA",
  anthem:             "ANTHEM",
  centene:            "CENTENE",
  molina:             "MOLINA",
  "kaiser-permanente":"KAISER",
};

// Full display names — auto-generates from slug if not listed
export const PAYER_DISPLAY: Record<string, string> = {
  aetna:              "Aetna",
  uhc:                "UnitedHealthcare",
  unitedealthcare:    "UnitedHealthcare",
  cigna:              "Cigna",
  "bcbs-tx":          "BCBS Texas",
  "bcbs-fl":          "BCBS Florida",
  "bcbs-il":          "BCBS Illinois",
  humana:             "Humana",
  anthem:             "Anthem",
  centene:            "Centene",
  molina:             "Molina Healthcare",
  "kaiser-permanente":"Kaiser Permanente",
};

/**
 * Get display name for a payer ID. Falls back to title-cased slug.
 */
export function payerLabel(id: string): string {
  return PAYER_DISPLAY[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get abbreviation for a payer ID. Falls back to uppercase slug.
 */
export function payerAbbr(id: string): string {
  return PAYER_ABBR[id] ?? id.toUpperCase().replace(/-/g, " ").slice(0, 8);
}

export function formatDate(iso: string, includeDay = false) {
  const d = new Date(iso + "T00:00:00");
  return includeDay
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
