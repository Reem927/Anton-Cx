export const Claude_Prompt = `
1. Drug name (brand and generic)
2. Name of the payer (Insurance Company)
3. Drug Category (Oncology - Cancer Drugs)
4. Type of plan (Commercial, Medicaid & Medicare)
5. Type of policy (Medical Benefit Policy & Pharmacy Benefit Policy)
6. Coverage State:
    1. Covered
    2. Not Covered (Similar to Formulary Tier + Rejected drug)
    3. No Policy Found (No medical or pharmacy)
    4. Pharmacy only (skips Formulary Tier, PA Required and Step Therapy)
7. Tells them the Medical Benefit Policy does not exist for this drug
8. The drug access status within that category (Formulary Tier)
    1. Preferred Speciality
    2. Non-Speciality
    3. Non-Preferred
    4. Not Covered
9. No. of drugs on that tier and rank (higher % of rebate), Example:
    - Preferred Rank → what position on that tier (1st, 2nd, 3rd)
    - Total drugs sharing that tier → how many competitors
    - Position Label → "Preferred 1 of 2" (human-readable)
    - Competing drugs → who else is on that tier
    - Rebate implication
        1. 1 of 1 → exclusive → manufacturer paid highest rebate
        2. 1 of 2 → semi-exclusive → moderate rebate
        3. 1 of 3 → competitive → smaller individual rebate
        4. Non-Preferred → lost negotiation → minimal rebate
10. Covered Indications/diagnoses
    1. What to extract example:
        - Cancer type (e.g. non-small cell lung cancer, breast cancer, colorectal cancer)
        - Stage or severity (e.g. stage III, stage IV, metastatic, unresectable)
        - Line of therapy (e.g. first-line, second-line, after prior treatment failure)
        - Biomarker or genetic marker requirements (e.g. PD-L1 positive, HER2 positive, EGFR mutation, MSI-H)
        - Whether it is monotherapy or combination therapy
        - Patient population (e.g. adult, pediatric, specific age range)
        - Histology type (e.g. squamous, non-squamous, adenocarcinoma)
        - Any excluded cancer subtypes explicitly mentioned
11. Prior Authorisation Requirements (Yes/no + Criteria text)
    - A requirement that a provider obtain approval from the health plan before administering a drug, confirming that the patient meets coverage criteria. PA criteria vary by payer and by drug.
    1. Yes
    Example of the criteria:
        - Prescriber type required (e.g. oncologist, hematologist, must be board certified)
        - Diagnosis documentation required (e.g. pathology report confirming cancer type and stage)
        - Biomarker testing required (e.g. PD-L1 expression test, HER2 testing, KRAS mutation test — oncology is heavy on this)
        - Performance status requirement (e.g. ECOG performance status 0-2 — this is an oncology specific score measuring how well a patient can perform daily activities)
        - Prior treatment failure proof (e.g. must have failed platinum-based chemotherapy first)
        - Lab result requirements (e.g. adequate organ function, CBC, liver function tests)
        - Imaging documentation (e.g. CT scan or PET scan confirming disease progression)
        - Duration requirements (e.g. symptoms documented for minimum X weeks)
        - Whether a tumor board review is required
        - Whether clinical trial enrollment was considered first
        - Renewal criteria (e.g. must show stable disease or partial response at 12 weeks)
        - Whether PA applies per cycle or per treatment course
    2. No
12. Step Therapy Requirements:
    - A policy requiring patients to try (and fail) one or more lower-cost or preferred drugs before a more expensive drug will be covered. For example, a plan might require trying a biosimilar before approving the reference biologic.
    1. Yes → must try biosimilar, before biologic drug. What drug must be tried first?
        - Example of what to extract:
        - Each drug that must be tried first in order (step 1, step 2, step 3)
        - Whether each step drug is a biosimilar, reference biologic, chemotherapy, or targeted therapy
        - Minimum trial duration at each step
        - How failure is defined at each step (e.g. disease progression on imaging, intolerance, toxicity)
        - Whether biosimilar must be tried before reference biologic specifically
        - Which biosimilars are acceptable at the biosimilar step
        - Whether step therapy can be bypassed and under what conditions (e.g. contraindication to step drug)
        - Whether prior treatment at another payer counts toward step therapy proof
        - What documentation proves failure at each step (e.g. oncologist letter, imaging report)
        - Whether step therapy applies to all indications or only specific cancer types
    2. No
13. Covered Alternatives (CA)
    - Add covered alternatives extraction to the policy JSON builder. When a drug is marked as Not Covered the policy document may list Covered Alternatives labeled as CA in the Notes and Restrictions column which are other drugs in the same category the payer will cover instead. Extract each alternative drug name, its HCPCS or J-code if provided, whether it is a biosimilar or reference biologic, and whether PA is required for that alternative. If the drug is covered or no alternatives are listed set covered_alternatives to an empty array. Also handle the other shorthand flags that appear in policy documents — if PA appears mark prior_auth_required as true even without criteria text, if SOS appears extract the site of service restriction for that drug, and if CC appears extract any coverage change description. All four flags PA, SOS, CC, and CA must be detected and mapped to their corresponding JSON fields during extraction.
14. site-of-care restrictions (location of drug usage can differ the cost)
    - Extract all locations where the drug can and cannot be administered. Look for terms like SOS, site of service, place of service, infusion location, and site of care program. For oncology specifically look for any language about redirecting from hospital outpatient to ambulatory infusion center. Use only these standardized site values: physician_office, ambulatory_infusion_center, home_infusion, hospital_outpatient_department, inpatient_hospital.
    Where a drug is physically administered: hospital outpatient department, physician office, ambulatory infusion center, or home infusion. Some health plans restrict which sites they will reimburse, often preferring lower-cost settings.
15. dosing/quantity limit (cost per vial or per usage depends on the policy and payer)
    - Extract the dose amount and unit, how the dose is calculated (flat dose, weight based, or body surface area based), how often it is administered, maximum quantity per dispensing, maximum treatment duration, and any wastage or single use vial policy. For oncology look for per cycle dosing language and whether there is a maximum number of cycles allowed.
16. effective date of the policy (Different formats across different payer policies centralise it into one format)
    - Extract the effective date, last reviewed date if present, next review date if present, version number or label if present, and any reference to a previous policy version this supersedes. Convert all dates to YYYY-MM-DD format regardless of how they appear in the original document. If only one date is present treat it as the effective date.
17. Pulls automatically to compare old file to new file of that specific policy:
    - Build a changeTracker.js file that exports a CHANGE_TRACKING_PROMPT template string and a compareVersions async function. The prompt takes OLD_JSON and NEW_JSON placeholders and tells Claude to compare two oncology drug policy JSON objects field by field returning only valid JSON with a changed_fields array. Each item in the array needs field_name, old_value, new_value, severity as major or moderate or cosmetic, clinical_impact as boolean, and impact_explanation as one sentence. The compareVersions function takes two JSON objects, inserts them into the prompt, calls claude-sonnet-4-5 via the Anthropic SDK, parses the response, and returns null if either JSON is missing. Wrap everything in try catch. API key from process.env.ANTHROPIC_API_KEY.
18. Price
    - If this policy document contains any drug pricing information such as wholesale acquisition cost, average sales price, ASP, WAC, benchmark price, or any dollar amount associated with the drug itself extract it. Include the price amount, unit (per vial, per mg, per dose), and the pricing basis used. If no pricing information appears anywhere in the document set price to null and set appears_in_policy to false. Never estimate or assume a price value.
19. Copay
    - If this policy document contains any patient cost sharing information such as copay amount, coinsurance percentage, cost sharing tier, or out of pocket responsibility extract it. Include the copay amount or percentage, whether it applies per dose or per cycle, and any copay assistance or exception language. If no copay or cost sharing information appears anywhere in the document set copay to null and set appears_in_policy to false. Never estimate or assume a copay value.
20. Rate
    - If this policy document contains any rebate language such as rebate percentage, manufacturer rebate agreement, supplemental rebate, or any reference to payments from manufacturer to payer extract it. Include the rebate percentage or amount if stated, whether it is a base or supplemental rebate, and any conditions tied to the rebate such as market share thresholds or exclusivity requirements. If no rebate information appears anywhere in the document set rebate_rate to null and set appears_in_policy to false. Note that rebate details are almost never published in policy documents as they are confidential contract terms — null is the expected result in most cases.
21. Terminology needed for claude to know:
    - Biologic — A complex drug derived from living organisms, often administered by injection or infusion. Examples include treatments for cancer, autoimmune diseases, and rare conditions. Biologics are among the most expensive drugs on the market.
    - Biosimilar — A copycat version of a reference biologic made by a different manufacturer after the patent expires. Approved by the FDA as clinically equivalent but not chemically identical. Examples include Hadlima, Hyrimoz, and Cyltezo which are all biosimilars of Humira.
    - Buy-and-Bill — A model where a healthcare provider purchases a drug, administers it to the patient, and then bills the patient's insurance for reimbursement. This is the standard model for most medical benefit drugs.
    - Coverage Criteria — The specific clinical conditions a patient must meet for a health plan to approve coverage of a drug. These may include diagnosis requirements, lab results, prior drug failures, or prescriber specialty requirements.
    - Coverage State — Whether a policy exists for a drug at a given payer. Four possible states: Covered (policy exists and drug is approved), Not Covered (payer explicitly reviewed and denied), No Policy Found (payer has not published a policy for this drug), Pharmacy Only (no medical benefit policy exists but a pharmacy benefit version was detected).
    - Covered Alternatives (CA) — Other drugs in the same therapeutic category that the payer will cover instead when a drug is marked as Not Covered. Listed in the Notes and Restrictions column of policy documents.
    - Coverage Change (CC) — A flag appearing in policy documents indicating that the coverage status or criteria for a drug has recently changed.
    - Formulary — A list of drugs covered by an insurance plan, typically organized into tiers that affect patient cost-sharing. Pharmacy benefit drugs have well-structured formularies. Medical benefit drugs generally do not, which is the core of this challenge.
    - Formulary Tier — The shelf position assigned to a drug within the formulary indicating its preferred status. Tiers used by Priority Health and similar payers include Preferred Specialty, Non-Specialty, Non-Preferred, and Not Covered.
    - Formulary Position / Access Status — The competitive position of a drug within its therapeutic category combining tier, rank, and number of competing drugs. Expressed as a position label such as Preferred 1 of 2. Directly drives rebate economics — a drug preferred 1 of 2 commands a different rebate rate than a drug preferred 1 of 3 or with exclusive preferred status.
    - HCPCS Code — Healthcare Common Procedure Coding System. A standardized code set used to bill for drugs, procedures, and services. Medical benefit drugs are identified by J-codes such as J9035 for bevacizumab. These codes appear in medical policies and are useful for identifying specific drugs across payers.
    - Medical Benefit — The part of a health insurance plan that covers services provided by doctors and facilities including surgeries, office visits, and infusions. Drugs administered in a clinical setting are typically covered here, not under the pharmacy benefit.
    - Medical Policy — A document published by a health plan that defines whether a specific drug or service is considered medically necessary and under what conditions it will be covered. Also called medical benefit drug policy, drug and biologic coverage policy, medical pharmacy policy, coverage determination guideline, and clinical policy bulletin. The name varies by payer but the function is the same.
    - Medical Benefit Drugs — Drugs administered in a clinical setting and covered under a patient's medical insurance benefit rather than their pharmacy benefit. Also referred to as medical pharmacy drugs, medical drugs, specialty drugs on the medical benefit, provider-administered drugs, physician-administered drugs, medical injectables, and buy-and-bill drugs.
    - Payer — An organization that pays for healthcare services, typically a health insurance company or health plan such as UnitedHealthcare, Cigna, Aetna, or a Blue Cross Blue Shield plan.
    - PBM — Pharmacy Benefit Manager. A company that manages the pharmacy benefit on behalf of a health plan including formulary design, rebate negotiation, and claims processing. PBMs typically do not manage the medical benefit side which is one reason medical benefit drug tracking is less standardized.
    - Pharmacy Benefit — The part of a health insurance plan that covers prescription drugs picked up at a retail or mail-order pharmacy. This is the familiar, well-organized side of drug coverage with clear formulary tiers and electronic eligibility checks.
    - Plan Type — The category of health insurance plan. Commercial plans are employer-sponsored or individually purchased private insurance. Medicare is the federal program for people 65 and older. Medicaid is the federal and state program for low-income individuals.
    - Prior Authorization (PA) — A requirement that a provider obtain approval from the health plan before administering a drug, confirming that the patient meets coverage criteria. PA criteria vary by payer and by drug. In oncology PA criteria commonly includes prescriber type, diagnosis documentation, biomarker test results, ECOG performance status, prior treatment failure proof, lab results, and imaging documentation.
    - Rebate — A payment made by a drug manufacturer back to a payer in exchange for preferred formulary position. The rebate percentage and amount depend on the drug's competitive position within its category. A drug with exclusive preferred status commands a higher rebate than a drug sharing preferred status with competitors.
    - Site of Care (SOS) — Where a drug is physically administered. Options include physician office, ambulatory infusion center, home infusion, hospital outpatient department, and inpatient hospital. Some health plans restrict which sites they will reimburse, often preferring lower-cost settings. In oncology payers frequently redirect patients from hospital outpatient departments to ambulatory infusion centers to reduce costs.
    - Step Therapy — A policy requiring patients to try and fail one or more lower-cost or preferred drugs before a more expensive drug will be covered. In oncology and immunology this commonly means trying a biosimilar before the reference biologic will be approved.
    - ECOG Performance Status — An oncology-specific score from 0 to 5 measuring how well a patient can perform daily activities. Used in PA criteria for oncology drugs. Score 0 means fully active, score 5 means deceased. Most payers require ECOG 0 to 2 for approval of high-cost oncology biologics.
    - Biomarker — A measurable biological indicator used to determine whether a patient is eligible for a specific oncology drug. Examples include PD-L1 expression level for Keytruda, HER2 status for Herceptin, EGFR mutation for targeted lung cancer therapies, and MSI-H status for immunotherapy eligibility. Biomarker testing is both a covered indication qualifier and a PA criteria requirement in oncology policies.
    - Line of Therapy — The sequence in which treatments are given for cancer. First-line therapy is the initial treatment. Second-line is given after first-line fails. Third-line and beyond follow subsequent failures. Many oncology policies only cover a drug for specific lines of therapy.
    - Wastage Policy — Rules about how to bill for unused portions of single-use drug vials. Because vials come in fixed sizes but doses are weight-based, leftover drug is common in oncology. Some payers allow billing for the full vial, others only allow billing for the amount actually administered.
`