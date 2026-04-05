interface ComparisonItem {
  company: string
  coverage: string
  tier: number
  dosage: string
  quantity: number | null
  price: number | null
  copay: number | null

  drugName?: string
  genericName?: string
  drugCategory?: string
  planType?: string
  policyType?: string
  coverageState?: string
  formularyAccessStatus?: string
  preferredRank?: number | null
  totalDrugsOnTier?: number | null
  positionLabel?: string
  competingDrugs?: string[]
  rebateImplication?: string
}

function money(value: number) {
  return `$${value.toFixed(2)}`
}

function generateAnalysisSummary(drugName: string, comparisonData: ComparisonItem[]): string {
  if (!comparisonData.length) {
    return `No comparison data was provided for ${drugName}.`
  }

  const withCopay = comparisonData.filter((c) => c.copay != null) as Array<ComparisonItem & { copay: number }>
  const withPrice = comparisonData.filter((c) => c.price != null) as Array<ComparisonItem & { price: number }>

  const lowestCopay = withCopay.length ? [...withCopay].sort((a, b) => a.copay - b.copay)[0] : null
  const lowestPrice = withPrice.length ? [...withPrice].sort((a, b) => a.price - b.price)[0] : null

  const covered = comparisonData.filter((c) => c.coverageState === "Covered")
  const notCovered = comparisonData.filter((c) => c.coverageState === "Not Covered")
  const noPolicy = comparisonData.filter((c) => c.coverageState === "No Policy Found")
  const pharmacyOnly = comparisonData.filter((c) => c.coverageState === "Pharmacy Only")

  let summary = `Comparison Summary for ${drugName}\n\n`

  const first = comparisonData[0]
  if (first.drugName || first.genericName || first.drugCategory) {
    summary += `Drug Overview:\n`
    summary += `• Brand / Generic: ${first.drugName || drugName}${first.genericName ? ` / ${first.genericName}` : ""}\n`
    if (first.drugCategory) summary += `• Category: ${first.drugCategory}\n`
    summary += `\n`
  }

  summary += `Coverage State:\n`
  if (covered.length) summary += `• Covered: ${covered.map((c) => c.company).join(", ")}\n`
  if (notCovered.length) summary += `• Not Covered: ${notCovered.map((c) => c.company).join(", ")}\n`
  if (noPolicy.length) summary += `• No Policy Found: ${noPolicy.map((c) => c.company).join(", ")}\n`
  if (pharmacyOnly.length) summary += `• Pharmacy Only: ${pharmacyOnly.map((c) => c.company).join(", ")}\n`
  summary += `\n`

  if (lowestCopay || lowestPrice) {
    summary += `Cost Highlights:\n`
    if (lowestCopay) summary += `• Lowest Copay: ${lowestCopay.company} at ${money(lowestCopay.copay)}\n`
    if (lowestPrice) summary += `• Lowest Price: ${lowestPrice.company} at ${money(lowestPrice.price)}\n`
    summary += `\n`
  }

  const ranked = comparisonData.filter((c) => c.positionLabel && c.positionLabel !== "N/A")
  if (ranked.length) {
    summary += `Ranking / Rebate:\n`
    ranked.slice(0, 3).forEach((item) => {
      summary += `• ${item.company}: ${item.positionLabel}`
      if (item.rebateImplication) summary += ` — ${item.rebateImplication}`
      summary += `\n`
    })
    summary += `\n`
  }

  const recommended =
    covered.find((c) => c.copay != null) ??
    covered[0] ??
    pharmacyOnly[0] ??
    comparisonData[0]

  summary += `Recommendation:\n`
  summary += `• ${recommended.company} is the strongest current option based on available policy data.`
  if (recommended.coverageState) summary += ` Coverage state: ${recommended.coverageState}.`
  if (recommended.formularyAccessStatus) summary += ` Access status: ${recommended.formularyAccessStatus}.`
  if (recommended.positionLabel && recommended.positionLabel !== "N/A") {
    summary += ` Ranking: ${recommended.positionLabel}.`
  }

  return summary
}

export async function POST(req: Request) {
  try {
    const { drugName, comparisonData } = await req.json()

    if (!drugName || !Array.isArray(comparisonData)) {
      return Response.json({ error: "Invalid request body." }, { status: 400 })
    }

    const summary = generateAnalysisSummary(drugName, comparisonData)
    return Response.json({ summary })
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to generate summary." }, { status: 500 })
  }
}