import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MAJOR_PAYER_IDS = [
  "uhc",
  "cigna",
  "emblemhealth",
  "upmc",
  "priority_health",
  "bcbs_nc",
  "florida_blue",
];

type UiCoverage = "Covered" | "Not Covered" | "No Policy Found" | "Pharmacy Only";

function titleCaseCoverage(value: string | null | undefined): UiCoverage {
  switch (value) {
    case "covered":
      return "Covered";
    case "not_covered":
      return "Not Covered";
    case "no_policy_found":
      return "No Policy Found";
    case "pharmacy_only":
      return "Pharmacy Only";
    default:
      return "No Policy Found";
  }
}

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return (
            (item as Record<string, unknown>).drug_name ??
            (item as Record<string, unknown>).name ??
            (item as Record<string, unknown>).generic ??
            ""
          );
        }
        return "";
      })
      .filter(Boolean) as string[];
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function parsePlanTypes(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string" && value.trim()) return value;
  return "N/A";
}

function parseMoney(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const maybeAmount = (value as Record<string, unknown>).amount;
    if (typeof maybeAmount === "number") return maybeAmount;
  }
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : null;
}

function parseQuantity(medical: any | null, pharmacy: any | null, overview: any | null) {
  const candidates = [
    overview?.quantity,
    overview?.quantity_limit,
    overview?.dosing?.quantity_limit,
    medical?.dosing?.quantity_limit,
    pharmacy?.quantity_limit,
  ];

  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }

  return null;
}

function normalizeCriteriaFromAny({
  overview,
  medical,
  pharmacy,
}: {
  overview?: any | null;
  medical?: any | null;
  pharmacy?: any | null;
}) {
  const coverage = titleCaseCoverage(
    overview?.coverage_status ?? medical?.coverage_status ?? pharmacy?.coverage_status
  );

  const isPharmacyOnly = coverage === "Pharmacy Only";
  const isNoPolicy = coverage === "No Policy Found";

  if (isPharmacyOnly || isNoPolicy) {
    return {
      coverageState: coverage,
      priorAuthorization: { status: "Skipped" },
      stepTherapy: { status: "Skipped" },
      quantityLimit: isNoPolicy ? "Skipped" : String(parseQuantity(medical, pharmacy, overview) ?? "Skipped"),
      ageRestriction: "Skipped",
      diagnosisRequirement: "Skipped",
      specialtyPharmacy: { status: "Skipped" },
      mailOrderAvailable: { status: "Skipped" },
      authorizationRenewal: "Skipped",
    };
  }

  return {
    coverageState: coverage,
    priorAuthorization: {
      status:
        overview?.prior_auth_required ?? medical?.prior_auth_required ? "Required" : "Not Required",
      note: overview?.prior_auth ?? medical?.prior_auth ?? undefined,
    },
    stepTherapy: {
      status:
        overview?.step_therapy_required ?? medical?.step_therapy_required ? "Required" : "Not Required",
      note: overview?.step_therapy ?? medical?.step_therapy ?? undefined,
    },
    quantityLimit: String(parseQuantity(medical, pharmacy, overview) ?? "N/A"),
    ageRestriction: String(
      overview?.age_restriction ?? medical?.flags?.age_restriction ?? "N/A"
    ),
    diagnosisRequirement:
      overview?.diagnosis_requirement ??
      (Array.isArray(medical?.indications) && medical.indications.length
        ? medical.indications
            .map((i: any) => (typeof i === "string" ? i : i?.diagnosis ?? ""))
            .filter(Boolean)
            .join(", ")
        : "N/A"),
    specialtyPharmacy: {
      status:
        overview?.specialty_pharmacy_required ?? medical?.flags?.specialty_pharmacy_required
          ? "Required"
          : "Not Required",
    },
    mailOrderAvailable: {
      status:
        overview?.mail_order_available ?? medical?.flags?.mail_order_available
          ? "Available"
          : "Not Available",
    },
    authorizationRenewal: String(
      overview?.authorization_renewal ?? medical?.flags?.authorization_renewal ?? "N/A"
    ),
  };
}

function normalizeRebateImplication(position: string | null | undefined, tier: string | null | undefined, coverage: UiCoverage) {
  if (coverage === "Not Covered" || coverage === "No Policy Found" || coverage === "Pharmacy Only") {
    return "N/A";
  }

  if (position === "1 of 1") return "1 of 1 → exclusive → manufacturer paid highest rebate";
  if (position === "1 of 2") return "1 of 2 → semi-exclusive → moderate rebate";
  if (position === "1 of 3" || position === "1 of 4" || position === "2 of 3") {
    return `${position} → competitive → smaller individual rebate`;
  }

  if ((tier ?? "").toLowerCase().includes("non-preferred")) {
    return "Lost negotiation → minimal rebate";
  }

  return "N/A";
}

function normalizeOverviewRow(row: any) {
  const coverage = titleCaseCoverage(row.coverage_status);
  const position = row.formulary_position ?? null;
  const tier = row.formulary_tier ?? null;

  return {
    id: row.id ?? `${row.payer_id}-${row.drug_name}`,
    payerId: row.payer_id ?? "",
    company: row.payer_name ?? row.company ?? row.payer_id ?? "Unknown",
    drugBrand: row.drug_name ?? "",
    drugGeneric: row.drug_generic ?? "",
    category: row.drug_category ?? "N/A",
    plan: parsePlanTypes(row.plan_types),
    policyType:
      row.policy_type === "medical_benefit"
        ? "Medical Benefit Policy"
        : row.policy_type === "pharmacy_benefit"
        ? "Pharmacy Benefit Policy"
        : row.policy_type === "both"
        ? "Medical + Pharmacy Benefit"
        : "N/A",
    coverage,
    access: row.access_status ?? row.formulary_tier ?? (coverage === "Not Covered" ? "Not Covered" : "N/A"),
    ranking: position ? `${row.formulary_tier ?? "N/A"} ${position}` : row.formulary_tier ?? "N/A",
    rankDetail: position ? `Rank ${position}` : "N/A",
    competingDrugs: parseArray(row.competing_drugs ?? row.covered_alternatives),
    rebateImplication: normalizeRebateImplication(position, tier, coverage),
    price: parseMoney(row.price),
    copay: parseMoney(row.copay),
    quantity: parseQuantity(null, null, row),
    policyTitle: row.source_document_title ?? row.policy_title ?? `${row.payer_name ?? row.payer_id} Policy`,
    policyEffective: row.effective_date ?? null,
    policyLinkLabel: row.source_document_title ?? row.policy_title ?? `${row.payer_name ?? row.payer_id} Policy`,
    summary: row.summary ?? row.notes ?? "No summary available",
    relatedProducts: parseArray(row.related_products),
    criteria: normalizeCriteriaFromAny({ overview: row }),
    medicalPolicyId: row.medical_policy_id ?? null,
    pharmacyPolicyId: row.pharmacy_policy_id ?? null,
    medicalPolicyExists: Boolean(row.medical_policy_id || row.policy_type === "medical_benefit" || row.policy_type === "both"),
    pharmacyPolicyExists: Boolean(row.pharmacy_policy_id || row.policy_type === "pharmacy_benefit" || row.policy_type === "both"),
    sourceUrl: row.source_url ?? null,
    policyJson: row,
  };
}

function overviewRowLooksUsable(row: any) {
  return Boolean(
    row &&
      (row.payer_id || row.payer_name) &&
      (row.drug_name || row.drug_generic) &&
      row.coverage_status
  );
}

function normalizeMedicalPharmacyRow({
  payerId,
  medical,
  pharmacy,
  drugName,
}: {
  payerId: string;
  medical: any | null;
  pharmacy: any | null;
  drugName: string;
}) {
  const source = medical ?? pharmacy;
  const coverage = titleCaseCoverage(medical?.coverage_status ?? pharmacy?.coverage_status);
  const position = medical?.formulary_position ?? null;
  const tier = medical?.formulary_tier ?? pharmacy?.formulary_tier ?? null;
  const competingDrugs = parseArray(medical?.covered_alternatives);

  return {
    id: source?.id ?? `${payerId}-${drugName}`,
    payerId,
    company: source?.payer_name ?? payerId,
    drugBrand: source?.drug_name ?? drugName,
    drugGeneric: source?.drug_generic ?? "",
    category: source?.drug_category ?? "N/A",
    plan: parsePlanTypes(source?.plan_types),
    policyType: medical ? "Medical Benefit Policy" : pharmacy ? "Pharmacy Benefit Policy" : "No Policy Found",
    coverage,
    access: tier ?? (coverage === "Not Covered" ? "Not Covered" : "N/A"),
    ranking: position ? `${tier ?? "N/A"} ${position}` : tier ?? "N/A",
    rankDetail: position ? `Rank ${position}` : "N/A",
    competingDrugs,
    rebateImplication: normalizeRebateImplication(position, tier, coverage),
    price: parseMoney(medical?.price),
    copay: parseMoney(medical?.copay),
    quantity: parseQuantity(medical, pharmacy, null),
    policyTitle:
      medical?.source_document_title ??
      pharmacy?.notes ??
      `${source?.payer_name ?? payerId} Policy`,
    policyEffective: medical?.effective_date ?? pharmacy?.effective_date ?? null,
    policyLinkLabel:
      medical?.source_document_title ??
      pharmacy?.notes ??
      `${source?.payer_name ?? payerId} Policy`,
    summary: medical?.flags?.summary ?? pharmacy?.notes ?? "No summary available",
    relatedProducts: parseArray(source?.flags?.related_products ?? competingDrugs),
    criteria: normalizeCriteriaFromAny({ medical, pharmacy }),
    medicalPolicyId: medical?.id ?? null,
    pharmacyPolicyId: pharmacy?.id ?? null,
    medicalPolicyExists: Boolean(medical),
    pharmacyPolicyExists: Boolean(pharmacy),
    sourceUrl: medical?.source_url ?? pharmacy?.source_url ?? null,
    policyJson: { medical, pharmacy },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const drugName = searchParams.get("drug_name")?.trim();
    const payerIds = searchParams
      .get("payer_ids")
      ?.split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const allCompanies = searchParams.get("all_companies") === "true";

    if (!drugName) {
      return NextResponse.json({ error: "drug_name is required" }, { status: 400 });
    }

    const activePayers =
      allCompanies ? MAJOR_PAYER_IDS : payerIds && payerIds.length > 0 ? payerIds : MAJOR_PAYER_IDS;

    // 1) Try overview first
    const { data: overviewRows, error: overviewError } = await supabase
      .from("policy_coverage_overview")
      .select("*")
      .ilike("drug_name", `%${drugName}%`)
      .in("payer_id", activePayers)
      .order("effective_date", { ascending: false });

    if (!overviewError && overviewRows && overviewRows.length > 0) {
      const usableRows = overviewRows.filter(overviewRowLooksUsable);
      if (usableRows.length > 0) {
        const latestByPayer = new Map<string, any>();
        for (const row of usableRows) {
          if (!latestByPayer.has(row.payer_id)) latestByPayer.set(row.payer_id, row);
        }

        const results = Array.from(latestByPayer.values()).map(normalizeOverviewRow);
        return NextResponse.json(results, { status: 200 });
      }
    }

    // 2) Fallback to medical + pharmacy
    const { data: medicalRows, error: medicalError } = await supabase
      .from("medical_benefit_policies")
      .select("*")
      .ilike("drug_name", `%${drugName}%`)
      .in("payer_id", activePayers)
      .order("effective_date", { ascending: false });

    if (medicalError) {
      return NextResponse.json({ error: medicalError.message }, { status: 500 });
    }

    const { data: pharmacyRows, error: pharmacyError } = await supabase
      .from("pharmacy_benefit_policies")
      .select("*")
      .ilike("drug_name", `%${drugName}%`)
      .in("payer_id", activePayers)
      .order("effective_date", { ascending: false });

    if (pharmacyError) {
      return NextResponse.json({ error: pharmacyError.message }, { status: 500 });
    }

    const latestMedicalByPayer = new Map<string, any>();
    for (const row of medicalRows ?? []) {
      if (!latestMedicalByPayer.has(row.payer_id)) latestMedicalByPayer.set(row.payer_id, row);
    }

    const latestPharmacyByPayer = new Map<string, any>();
    for (const row of pharmacyRows ?? []) {
      if (!latestPharmacyByPayer.has(row.payer_id)) latestPharmacyByPayer.set(row.payer_id, row);
    }

    const allPayers = Array.from(
      new Set([
        ...activePayers,
        ...Array.from(latestMedicalByPayer.keys()),
        ...Array.from(latestPharmacyByPayer.keys()),
      ])
    );

    const results = allPayers.map((payerId) =>
      normalizeMedicalPharmacyRow({
        payerId,
        medical: latestMedicalByPayer.get(payerId) ?? null,
        pharmacy: latestPharmacyByPayer.get(payerId) ?? null,
        drugName,
      })
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comparison query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
