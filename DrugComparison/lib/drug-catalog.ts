export type MoleculeType =
  | "reference_biologic"
  | "biosimilar"
  | "biologic"
  | "small_molecule";

export type TherapeuticArea =
  | "immunology"
  | "oncology"
  | "respiratory"
  | "gastroenterology"
  | "other";

export interface DrugCatalogEntry {
  canonicalName: string;
  genericName: string;
  moleculeType: MoleculeType;
  therapeuticArea: TherapeuticArea;
  drugCategory: string;
  relatedProducts: string[];
  policyGroupingHint: string;
}

export const DRUG_CATALOG: Record<string, DrugCatalogEntry> = {
  humira: {
    canonicalName: "Humira",
    genericName: "adalimumab",
    moleculeType: "reference_biologic",
    therapeuticArea: "immunology",
    drugCategory: "Immunology - Autoimmune Drugs",
    relatedProducts: ["Amjevita", "Hyrimoz", "Hadlima", "Cyltezo"],
    policyGroupingHint:
      "Some payers group the reference biologic and biosimilars together, while others separate them or use biosimilar-first step therapy.",
  },
  amjevita: {
    canonicalName: "Amjevita",
    genericName: "adalimumab-atto",
    moleculeType: "biosimilar",
    therapeuticArea: "immunology",
    drugCategory: "Immunology - Autoimmune Drugs",
    relatedProducts: ["Humira"],
    policyGroupingHint:
      "May appear under the Humira policy or as a separate biosimilar policy.",
  },
  hyrimoz: {
    canonicalName: "Hyrimoz",
    genericName: "adalimumab-adaz",
    moleculeType: "biosimilar",
    therapeuticArea: "immunology",
    drugCategory: "Immunology - Autoimmune Drugs",
    relatedProducts: ["Humira"],
    policyGroupingHint:
      "May appear under the Humira policy or as a separate biosimilar policy.",
  },
  hadlima: {
    canonicalName: "Hadlima",
    genericName: "adalimumab-bwwd",
    moleculeType: "biosimilar",
    therapeuticArea: "immunology",
    drugCategory: "Immunology - Autoimmune Drugs",
    relatedProducts: ["Humira"],
    policyGroupingHint:
      "May appear under the Humira policy or as a separate biosimilar policy.",
  },
  keytruda: {
    canonicalName: "Keytruda",
    genericName: "pembrolizumab",
    moleculeType: "biologic",
    therapeuticArea: "oncology",
    drugCategory: "Oncology - Cancer Drugs",
    relatedProducts: [],
    policyGroupingHint:
      "Usually policy-specific to oncology indications and biomarker criteria.",
  },
  dupixent: {
    canonicalName: "Dupixent",
    genericName: "dupilumab",
    moleculeType: "biologic",
    therapeuticArea: "immunology",
    drugCategory: "Immunology - Inflammatory Drugs",
    relatedProducts: [],
    policyGroupingHint:
      "Typically handled as a standalone biologic policy by indication.",
  },
  stelara: {
    canonicalName: "Stelara",
    genericName: "ustekinumab",
    moleculeType: "reference_biologic",
    therapeuticArea: "immunology",
    drugCategory: "Immunology - Autoimmune Drugs",
    relatedProducts: ["Wezlana"],
    policyGroupingHint:
      "May share policy context with biosimilars or use step edits depending on payer.",
  },
};

export function getDrugMeta(drugName: string): DrugCatalogEntry {
  const key = drugName.trim().toLowerCase();

  return (
    DRUG_CATALOG[key] ?? {
      canonicalName: drugName,
      genericName: `${drugName.toLowerCase()} generic`,
      moleculeType: "biologic",
      therapeuticArea: "other",
      drugCategory: "Other Specialty Drugs",
      relatedProducts: [],
      policyGroupingHint: "No mapped drug relationship yet.",
    }
  );
}

export function formatMoleculeType(type: MoleculeType) {
  switch (type) {
    case "reference_biologic":
      return "Reference Biologic";
    case "biosimilar":
      return "Biosimilar";
    case "biologic":
      return "Biologic";
    default:
      return "Small Molecule";
  }
}