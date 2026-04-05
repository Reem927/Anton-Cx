export const PAYER_ABBR: Record<string, string> = {
  aetna:    "AETNA",
  uhc:      "UHC",
  cigna:    "CIGNA",
  "bcbs-tx":"BCBS TX",
};

export const PAYER_DISPLAY: Record<string, string> = {
  aetna:    "Aetna",
  uhc:      "UnitedHealthcare",
  cigna:    "Cigna",
  "bcbs-tx":"BCBS Texas",
};

export function formatDate(iso: string, includeDay = false) {
  const d = new Date(iso + "T00:00:00");
  return includeDay
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
