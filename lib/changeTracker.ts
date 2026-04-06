import type { ChangeSeverity } from "./types";

export function getChangeSeverityColor(severity: ChangeSeverity) {
  return {
    major:    { dot: "#B02020", bg: "#FEE8E8", text: "#B02020", border: "#F5C0C0", label: "MAJOR" },
    moderate: { dot: "#D4880A", bg: "#FFF4E0", text: "#D4880A", border: "#F5D898", label: "MODERATE" },
    cosmetic: { dot: "#6A7590", bg: "#F7F8FC", text: "#6A7590", border: "#E8EBF2", label: "COSMETIC" },
  }[severity];
}
