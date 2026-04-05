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

function normalizeCoverageState(
  medical: any | null,
  pharmacy: any | null
): "Covered" | "Not Covered" | "No Policy Found" | "Pharmacy Only" {
  if (medical) {
    if (medical.coverage_status === "covered") return "Covered";
    if (medical.coverage_status === "not_covered") return "Not Covered";
  }

  if (!medical && pharmacy) return "Pharmacy Only";
  return "No Policy Found";
}

function normalizeAccessStatus(medical: any | null, pharmacy: any | null): string {
  if (!medical && pharmacy) return "N/A";
  if (!medical && !pharmacy) return "N/A";

  const tier = medical?.formulary_tier ?? pharmacy?.formulary_tier ?? null;
  if (!tier) {
    if (medical?.coverage_status === "not_covered") return "Not Covered";
    return "N/A";
  }

  return String(tier);
}

function normalizePolicyType(medical: any | null, pharmacy: any | null): string {
  if (medical) return "Medical Benefit Policy";
  if (pharmacy) return "Pharmacy Benefit Policy";
  return "No Policy Found";
}

function normalizeRanking(medical: any | null, pharmacy: any | null): string {
  const position = medical?.formulary_position ?? null;
  const tier = medical?.formulary_tier ?? pharmacy?.formulary_tier ?? null;

  if (!medical && pharmacy) return "N/A";
  if (!medical && !pharmacy) return "N/A";
  if (medical?.coverage_status === "not_covered") {
    return position ? `Not Covered ${position}` : "Not Covered";
  }
  if (!tier) return "N/A";
  if (position) return `${tier} ${position}`;
  return String(tier);
}

function normalizeRankDetail(medical: any | null): string {
  const position = medical?.formulary_position ?? null;
  return position ? `Rank ${position}` : "N/A";
}

function normalizeCompetingDrugs(medical: any | null): string[] {
  if (!medical?.covered_alternatives) return [];
  if (Array.isArray(medical.covered_alternatives)) {
    return medical.covered_alternatives
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          return item.drug_name ?? item.name ?? item.generic ?? "";
        }
        return "";
      })
      .filter(Boolean);
  }
  return [];
}

function normalizeRebateImplication(medical: any | null): string {
  if (!medical) return "N/A";
  if (medical.coverage_status === "not_covered") return "N/A";

  const position = medical?.formulary_position ?? "";
  if (position === "1 of 1") return "1 of 1 → exclusive → manufacturer paid highest rebate";
  if (position === "1 of 2") return "1 of 2 → semi-exclusive → moderate rebate";
  if (position === "1 of 3" || position === "1 of 4" || position === "2 of 3") {
    return `${position} → competitive → smaller individual rebate`;
  }

  const tier = String(medical?.formulary_tier ?? "").toLowerCase();
  if (tier.includes("non-preferred")) return "Lost negotiation → minimal rebate";

  return "N/A";
}

function normalizeCriteria(medical: any | null, pharmacy: any | null) {
  const coverageState = normalizeCoverageState(medical, pharmacy);

  if (!medical && pharmacy) {
    return {
      coverageState,
      priorAuthorization: { status: "Skipped" },
      stepTherapy: { status: "Skipped" },
      quantityLimit: "Skipped",
      ageRestriction: "Skipped",
      diagnosisRequirement: "Skipped",
      specialtyPharmacy: { status: "Skipped" },
      mailOrderAvailable: { status: "Skipped" },
      authorizationRenewal: "Skipped",
    };
  }

  if (!medical && !pharmacy) {
    return {
      coverageState,
      priorAuthorization: { status: "Skipped" },
      stepTherapy: { status: "Skipped" },
      quantityLimit: "Skipped",
      ageRestriction: "Skipped",
      diagnosisRequirement: "Skipped",
      specialtyPharmacy: { status: "Skipped" },
      mailOrderAvailable: { status: "Skipped" },
      authorizationRenewal: "Skipped",
    };
  }

  return {
    coverageState,
    priorAuthorization: {
      status: medical?.prior_auth_required ? "Required" : "Not Required",
      note: medical?.prior_auth ?? undefined,
    },
    stepTherapy: {
      status: medical?.step_therapy_required ? "Required" : "Not Required",
      note: medical?.step_therapy ?? undefined,
    },
    quantityLimit: medical?.dosing?.quantity_limit ?? pharmacy?.quantity_limit ?? "N/A",
    ageRestriction: medical?.flags?.age_restriction ?? "N/A",
    diagnosisRequirement:
      Array.isArray(medical?.indications) && medical.indications.length > 0
        ? medical.indications
            .map((i: any) => (typeof i === "string" ? i : i.diagnosis ?? ""))
            .filter(Boolean)
            .join(", ")
        : "N/A",
    specialtyPharmacy: {
      status: medical?.flags?.specialty_pharmacy_required ? "Required" : "Not Required",
    },
    mailOrderAvailable: {
      status: medical?.flags?.mail_order_available ? "Available" : "Not Available",
    },
    authorizationRenewal: medical?.flags?.authorization_renewal ?? "N/A",
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

    const results = allPayers.map((payerId) => {
      const medical = latestMedicalByPayer.get(payerId) ?? null;
      const pharmacy = latestPharmacyByPayer.get(payerId) ?? null;
      const source = medical ?? pharmacy;
      const competingDrugs = normalizeCompetingDrugs(medical);

      return {
        id: source?.id ?? `${payerId}-${drugName}`,
        payerId,
        company: source?.payer_name ?? payerId,
        drugBrand: source?.drug_name ?? drugName,
        drugGeneric: source?.drug_generic ?? "",
        category: source?.drug_category ?? "N/A",
        plan: Array.isArray(source?.plan_types)
          ? source.plan_types.join(", ")
          : source?.plan_types ?? "N/A",
        policyType: normalizePolicyType(medical, pharmacy),
        coverage: normalizeCoverageState(medical, pharmacy),
        access: normalizeAccessStatus(medical, pharmacy),
        ranking: normalizeRanking(medical, pharmacy),
        rankDetail: normalizeRankDetail(medical),
        competingDrugs,
        rebateImplication: normalizeRebateImplication(medical),
        price: medical?.price?.amount ?? medical?.price ?? null,
        copay: medical?.copay?.amount ?? medical?.copay ?? null,
        quantity: medical?.dosing?.quantity_limit ?? pharmacy?.quantity_limit ?? null,
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
        relatedProducts: source?.flags?.related_products ?? competingDrugs,
        criteria: normalizeCriteria(medical, pharmacy),
        medicalPolicyId: medical?.id ?? null,
        pharmacyPolicyId: pharmacy?.id ?? null,
        medicalPolicyExists: Boolean(medical),
        pharmacyPolicyExists: Boolean(pharmacy),
        sourceUrl: medical?.source_url ?? pharmacy?.source_url ?? null,
        policyJson: {
          medical,
          pharmacy,
        },
      };
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comparison query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}