import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function parseCompositeId(raw: string) {
  if (raw.startsWith("medical:")) {
    return { kind: "medical" as const, medicalId: raw.slice("medical:".length), pharmacyId: null };
  }
  if (raw.startsWith("pharmacy:")) {
    return { kind: "pharmacy" as const, medicalId: null, pharmacyId: raw.slice("pharmacy:".length) };
  }
  if (raw.startsWith("both:")) {
    const payload = raw.slice("both:".length);
    const [medicalId, pharmacyId] = payload.split(":");
    return { kind: "both" as const, medicalId, pharmacyId };
  }
  return { kind: "unknown" as const, medicalId: null, pharmacyId: null };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = parseCompositeId(id);
    const supabase = await createClient();

    if (parsed.kind === "unknown") {
      return NextResponse.json({ error: "Invalid policy id." }, { status: 400 });
    }

    const medicalPromise = parsed.medicalId
      ? supabase.from("medical_benefit_policies").select("*").eq("id", parsed.medicalId).single()
      : Promise.resolve({ data: null, error: null });

    const pharmacyPromise = parsed.pharmacyId
      ? supabase.from("pharmacy_benefit_policies").select("*").eq("id", parsed.pharmacyId).single()
      : Promise.resolve({ data: null, error: null });

    const [{ data: medical, error: medicalError }, { data: pharmacy, error: pharmacyError }] =
      await Promise.all([medicalPromise, pharmacyPromise]);

    if (medicalError && medicalError.code !== "PGRST116") {
      return NextResponse.json({ error: medicalError.message }, { status: 500 });
    }
    if (pharmacyError && pharmacyError.code !== "PGRST116") {
      return NextResponse.json({ error: pharmacyError.message }, { status: 500 });
    }

    if (!medical && !pharmacy) {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        policy: {
          medical,
          pharmacy,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load policy JSON.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}