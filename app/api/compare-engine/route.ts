import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { MedicalBenefitPolicy, PharmacyBenefitPolicy } from "@/lib/types/policy";

type CoverageState = "Covered" | "Not Covered" | "No Policy Found" | "Pharmacy Only";
type AccessStatus = "Preferred Specialty" | "Non-Specialty" | "Non-Preferred" | "Not Covered" | "N/A";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesPayer(input: string, actual: string) {
  const a = normalize(input);
  const b = normalize(actual);
  return a === b || a.includes(b) || b.includes(a);
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPlanTypes(planTypes?: string[] | null) {
  if (!planTypes || !planTypes.length) return "Commercial";
  return planTypes.map((p) => titleCase(p)).join(", ");
}

function formatPolicyType(
  medical: MedicalBenefitPolicy | null,
  pharmacy: PharmacyBenefitPolicy | null
) {
  if (medical && pharmacy) return "Medical Benefit Policy + Pharmacy Benefit Policy";
  if (medical) return "Medical Benefit Policy";
  if (pharmacy) return "Pharmacy Benefit Policy";
  return "No Policy Found";
}

function getCoverageState(
  medical: MedicalBenefitPolicy | null,
  pharmacy: PharmacyBenefitPolicy | null
): CoverageState {
  if (!medical && !pharmacy) return "No Policy Found";
  if (!medical && pharmacy) return "Pharmacy Only";
  if (!medical) return "No Policy Found";

  if (medical.coverage_status === "not_covered") return "Not Covered";
  if (medical.coverage_status === "no_policy_found") {
    return pharmacy ? "Pharmacy Only" : "No Policy Found";
  }
  return "Covered";
}

function getLegacyCoverage(
  medical: MedicalBenefitPolicy | null,
  pharmacy: PharmacyBenefitPolicy | null
): "Covered" | "Prior Auth" | "Step Therapy" | "Not Covered" {
  const coverageState = getCoverageState(medical, pharmacy);
  if (coverageState === "Not Covered" || coverageState === "No Policy Found") {
    return "Not Covered";
  }
  if (medical?.prior_auth_required) return "Prior Auth";
  if (medical?.step_therapy_required) return "Step Therapy";
  return "Covered";
}

function getAccessStatus(
  medical: MedicalBenefitPolicy | null,
  pharmacy: PharmacyBenefitPolicy | null,
  coverageState: CoverageState
): AccessStatus {
  if (coverageState === "No Policy Found" || coverageState === "Pharmacy Only") return "N/A";
  if (coverageState === "Not Covered") return "Not Covered";

  const tier = medical?.formulary_tier ?? pharmacy?.formulary_tier ?? null;

  switch (tier) {
    case "preferred_specialty":
      return "Preferred Specialty";
    case "non_specialty":
      return "Non-Specialty";
    case "non_preferred":
      return "Non-Preferred";
    case "not_covered":
      return "Not Covered";
    default:
      return "Preferred Specialty";
  }
}

function formatPositionLabel(
  accessStatus: AccessStatus,
  rank: number | null,
  total: number | null
) {
  if (accessStatus === "N/A" || accessStatus === "Not Covered") return "N/A";
  if (!rank || !total) return accessStatus;
  return `${accessStatus} ${rank} of ${total}`;
}

function formatRebateImplication(value: string | null | undefined) {
  if (!value) return "N/A";

  switch (value) {
    case "exclusive":
      return "1 of 1 → exclusive → manufacturer paid highest rebate";
    case "semi_exclusive":
      return "1 of 2 → semi-exclusive → moderate rebate";
    case "competitive":
      return "1 of 3+ → competitive → smaller individual rebate";
    case "non_preferred":
      return "Non-Preferred → lost negotiation → minimal rebate";
    default:
      return titleCase(value);
  }
}

function summarizePolicy(
  medical: MedicalBenefitPolicy | null,
  pharmacy: PharmacyBenefitPolicy | null,
  coverageState: CoverageState
) {
  if (coverageState === "No Policy Found") {
    return "No medical or pharmacy policy was found for this payer and drug combination.";
  }
  if (coverageState === "Pharmacy Only") {
    return "A pharmacy policy exists, but no medical benefit policy was found for this drug.";
  }

  const pieces: string[] = [];

  if (medical?.source_document_title) {
    pieces.push(medical.source_document_title);
  }

  if (medical?.prior_auth?.criteria_text) {
    pieces.push(`PA: ${medical.prior_auth.criteria_text}`);
  }

  if (medical?.step_therapy_required && medical.step_therapy?.steps?.length) {
    pieces.push(
      `Step therapy: ${medical.step_therapy.steps
        .map((s) => s.drug_name)
        .filter(Boolean)
        .join(", ")}`
    );
  }

  if (medical?.site_of_care?.preferred_site) {
    pieces.push(`Preferred site: ${medical.site_of_care.preferred_site}`);
  }

  if (!pieces.length && pharmacy?.notes) {
    pieces.push(pharmacy.notes);
  }

  return pieces.join(" • ") || "Policy extracted successfully.";
}

function quantityFromPolicy(
  medical: MedicalBenefitPolicy | null,
  pharmacy: PharmacyBenefitPolicy | null
) {
  if (medical?.dosing?.max_cycles) return medical.dosing.max_cycles;
  if (medical?.dosing?.max_quantity) {
    const match = medical.dosing.max_quantity.match(/\d+/);
    if (match) return Number(match[0]);
  }
  if (pharmacy?.quantity_limit) {
    const match = pharmacy.quantity_limit.match(/\d+/);
    if (match) return Number(match[0]);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const drugName = String(body.drugName ?? "").trim();
    const companies = Array.isArray(body.companies) ? body.companies.map(String) : [];
    const searchAllCompanies = Boolean(body.searchAllCompanies);

    if (!drugName) {
      return NextResponse.json({ error: "drugName is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const medicalQuery = supabase
      .from("medical_benefit_policies")
      .select("*")
      .or(`drug_name.ilike.%${drugName}%,drug_generic.ilike.%${drugName}%`)
      .order("effective_date", { ascending: false });

    const pharmacyQuery = supabase
      .from("pharmacy_benefit_policies")
      .select("*")
      .or(`drug_name.ilike.%${drugName}%,drug_generic.ilike.%${drugName}%`)
      .order("effective_date", { ascending: false });

    const [{ data: medicalRows, error: medicalError }, { data: pharmacyRows, error: pharmacyError }] =
      await Promise.all([medicalQuery, pharmacyQuery]);

    if (medicalError) {
      return NextResponse.json({ error: medicalError.message }, { status: 500 });
    }

    if (pharmacyError) {
      return NextResponse.json({ error: pharmacyError.message }, { status: 500 });
    }

    const medicalPolicies = (medicalRows ?? []) as MedicalBenefitPolicy[];
    const pharmacyPolicies = (pharmacyRows ?? []) as PharmacyBenefitPolicy[];

    const availablePayers = Array.from(
      new Set([
        ...medicalPolicies.map((p) => p.payer_name),
        ...pharmacyPolicies.map((p) => p.payer_name),
      ])
    );

    const selectedPayers =
      searchAllCompanies || companies.length === 0 ? availablePayers : companies;

    const results = selectedPayers.map((company: string) => {
      const medical =
        medicalPolicies.find((p) => matchesPayer(company, p.payer_name)) ?? null;
      const pharmacy =
        pharmacyPolicies.find((p) => matchesPayer(company, p.payer_name)) ?? null;

      const coverageState = getCoverageState(medical, pharmacy);
      const accessStatus = getAccessStatus(medical, pharmacy, coverageState);
      const rank = medical?.formulary_position?.rank ?? null;
      const total = medical?.formulary_position?.total_on_tier ?? null;

      const companyName = medical?.payer_name ?? pharmacy?.payer_name ?? company;
      const drugLabel = medical?.drug_name ?? pharmacy?.drug_name ?? drugName;
      const genericName = medical?.drug_generic ?? pharmacy?.drug_generic ?? drugName.toLowerCase();
      const drugCategory =
        medical?.drug_category ?? pharmacy?.drug_category ?? "Unknown Drug Category";

      const coverageCriteria = {
        priorAuthRequired: medical?.prior_auth_required ?? false,
        priorAuthDetails: medical?.prior_auth?.criteria_text ?? undefined,
        stepTherapyRequired: medical?.step_therapy_required ?? false,
        stepTherapyDetails:
          medical?.step_therapy?.steps?.length
            ? medical.step_therapy.steps.map((s) => s.drug_name).join(", ")
            : undefined,
        quantityLimit:
          medical?.dosing?.max_quantity ?? pharmacy?.quantity_limit ?? "Not stated",
        ageRestriction:
          medical?.indications?.[0]?.patient_population?.toLowerCase().includes("adult") ||
          medical?.indications?.[0]?.patient_population?.toLowerCase().includes("pediatric")
            ? medical?.indications?.[0]?.patient_population ?? undefined
            : undefined,
        diagnosisRequired: medical?.indications?.[0]?.diagnosis ?? undefined,
        specialtyPharmacyRequired: false,
        mailOrderAvailable: coverageState === "Pharmacy Only",
        renewalRequired: Boolean(medical?.prior_auth?.renewal_criteria),
        renewalPeriod: medical?.prior_auth?.renewal_criteria ?? undefined,
      };

      return {
        id:
          medical && pharmacy
            ? `both:${medical.id}:${pharmacy.id}`
            : medical
            ? `medical:${medical.id}`
            : pharmacy
            ? `pharmacy:${pharmacy.id}`
            : `missing:${normalize(company)}:${normalize(drugName)}`,
        company: companyName,
        drugName: drugLabel,
        genericName,
        drugCategory,
        planType: formatPlanTypes(medical?.plan_types ?? pharmacy?.plan_types ?? []),
        policyType: formatPolicyType(medical, pharmacy),
        coverageState,
        formularyAccessStatus: accessStatus,
        preferredRank: rank,
        totalDrugsOnTier: total,
        positionLabel: formatPositionLabel(accessStatus, rank, total),
        competingDrugs: medical?.formulary_position?.competing_drugs ?? [],
        rebateImplication: formatRebateImplication(medical?.formulary_position?.rebate_implication),
        coverage: getLegacyCoverage(medical, pharmacy),
        tier:
          medical?.formulary_tier === "preferred_specialty"
            ? 1
            : medical?.formulary_tier === "non_specialty"
            ? 2
            : medical?.formulary_tier === "non_preferred"
            ? 3
            : medical?.formulary_tier === "not_covered"
            ? 4
            : 0,
        dosage: medical?.dosing?.dose_amount ?? "Not stated",
        quantity: quantityFromPolicy(medical, pharmacy),
        price: medical?.price?.appears_in_policy ? medical.price.amount : null,
        copay: medical?.copay?.appears_in_policy ? medical.copay.amount : null,
        effectiveDate: medical?.effective_date ?? pharmacy?.effective_date ?? null,
        policyName:
          medical?.source_document_title ??
          pharmacy?.notes ??
          `${companyName} ${formatPolicyType(medical, pharmacy)}`,
        policyUrl:
          medical && pharmacy
            ? `/api/policy-json/both:${medical.id}:${pharmacy.id}`
            : medical
            ? `/api/policy-json/medical:${medical.id}`
            : pharmacy
            ? `/api/policy-json/pharmacy:${pharmacy.id}`
            : null,
        policySummary: summarizePolicy(medical, pharmacy, coverageState),
        coverageCriteria,
        moleculeType: null,
        therapeuticArea: null,
        relatedProducts: [],
        policyScopeNote:
          coverageState === "Pharmacy Only"
            ? "Medical benefit policy does not exist for this drug, but a pharmacy policy was found."
            : coverageState === "No Policy Found"
            ? "No medical or pharmacy policy was found."
            : medical?.medical_policy_exists === false
            ? "Medical policy does not exist for this drug."
            : "Policy extracted from ingested data.",
      };
    });

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown compare engine error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}