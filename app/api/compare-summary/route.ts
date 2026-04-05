// Note: To enable AI-powered summaries, add a credit card to your Vercel account
// Visit: https://vercel.com/~/ai to set up the AI Gateway
// Once configured, uncomment the generateText import and AI logic below

// import { generateText } from 'ai'

interface ComparisonItem {
  company: string
  coverage: string
  tier: number
  dosage: string
  quantity: number
  price: number
  copay: number

  drugName?: string
  genericName?: string
  drugCategory?: string
  planType?: string
  policyType?: string
  coverageState?: string
  formularyAccessStatus?: string
  preferredRank?: number
  totalDrugsOnTier?: number
  positionLabel?: string
  competingDrugs?: string[]
  rebateImplication?: string
}

function money(value: number) {
  return `$${value.toFixed(2)}`
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function generateAnalysisSummary(drugName: string, comparisonData: ComparisonItem[]): string {
  if (!comparisonData.length) {
    return `No comparison data was provided for ${drugName}.`
  }

  const sortedByCopay = [...comparisonData].sort((a, b) => a.copay - b.copay)
  const sortedByPrice = [...comparisonData].sort((a, b) => a.price - b.price)

  const lowestCopay = sortedByCopay[0]
  const lowestPrice = sortedByPrice[0]

  const coveredCompanies = comparisonData.filter((c) => c.coverage === "Covered")
  const priorAuthCompanies = comparisonData.filter((c) => c.coverage === "Prior Auth")
  const stepTherapyCompanies = comparisonData.filter((c) => c.coverage === "Step Therapy")
  const notCoveredCompanies = comparisonData.filter((c) => c.coverage === "Not Covered")

  const priceValues = comparisonData.map((c) => c.price)
  const copayValues = comparisonData.map((c) => c.copay)

  const priceRange = {
    min: Math.min(...priceValues),
    max: Math.max(...priceValues),
  }

  const copayRange = {
    min: Math.min(...copayValues),
    max: Math.max(...copayValues),
  }

  const avgPrice = average(priceValues)
  const avgCopay = average(copayValues)

  const bestCoveredOption =
    coveredCompanies.length > 0
      ? coveredCompanies.reduce((best, curr) => (curr.copay < best.copay ? curr : best))
      : lowestCopay

  const accessStates = Array.from(
    new Set(
      comparisonData
        .map((item) => item.coverageState)
        .filter((value): value is string => Boolean(value))
    )
  )

  const accessStatuses = Array.from(
    new Set(
      comparisonData
        .map((item) => item.formularyAccessStatus)
        .filter((value): value is string => Boolean(value))
    )
  )

  const bestRanked = [...comparisonData]
    .filter(
      (item) =>
        typeof item.preferredRank === "number" &&
        typeof item.totalDrugsOnTier === "number"
    )
    .sort((a, b) => {
      const aRank = a.preferredRank ?? 999
      const bRank = b.preferredRank ?? 999

      if (aRank !== bRank) return aRank - bRank

      const aTotal = a.totalDrugsOnTier ?? 999
      const bTotal = b.totalDrugsOnTier ?? 999
      return aTotal - bTotal
    })[0]

  const policyTypes = Array.from(
    new Set(
      comparisonData
        .map((item) => item.policyType)
        .filter((value): value is string => Boolean(value))
    )
  )

  const planTypes = Array.from(
    new Set(
      comparisonData
        .map((item) => item.planType)
        .filter((value): value is string => Boolean(value))
    )
  )

  let summary = `Comparison Summary for ${drugName}\n\n`

  const firstItem = comparisonData[0]
  if (firstItem.drugName || firstItem.genericName || firstItem.drugCategory) {
    summary += `Drug Overview:\n`
    summary += `• Brand / Generic: ${firstItem.drugName || drugName}${
      firstItem.genericName ? ` / ${firstItem.genericName}` : ""
    }\n`
    if (firstItem.drugCategory) {
      summary += `• Category: ${firstItem.drugCategory}\n`
    }
    if (planTypes.length) {
      summary += `• Plan Types Compared: ${planTypes.join(", ")}\n`
    }
    if (policyTypes.length) {
      summary += `• Policy Types Compared: ${policyTypes.join(", ")}\n`
    }
    summary += `\n`
  }

  summary += `Best Value:\n`
  summary += `• Lowest Copay: ${lowestCopay.company} at ${money(lowestCopay.copay)}`
  summary += typeof lowestCopay.tier === "number" ? ` (Tier ${lowestCopay.tier})` : ""
  summary += `\n`
  summary += `• Lowest Price: ${lowestPrice.company} at ${money(lowestPrice.price)}\n`
  summary += `• Best Covered Option: ${bestCoveredOption.company} with ${bestCoveredOption.coverage} status and ${money(bestCoveredOption.copay)} copay\n\n`

  summary += `Coverage Analysis:\n`
  if (coveredCompanies.length > 0) {
    summary += `• Covered: ${coveredCompanies.map((c) => c.company).join(", ")}\n`
  }
  if (priorAuthCompanies.length > 0) {
    summary += `• Prior Authorization Required: ${priorAuthCompanies.map((c) => c.company).join(", ")}\n`
  }
  if (stepTherapyCompanies.length > 0) {
    summary += `• Step Therapy Required: ${stepTherapyCompanies.map((c) => c.company).join(", ")}\n`
  }
  if (notCoveredCompanies.length > 0) {
    summary += `• Not Covered: ${notCoveredCompanies.map((c) => c.company).join(", ")}\n`
  }
  if (accessStates.length > 0) {
    summary += `• Coverage States Seen: ${accessStates.join(", ")}\n`
  }
  if (accessStatuses.length > 0) {
    summary += `• Access Statuses Seen: ${accessStatuses.join(", ")}\n`
  }
  summary += `\n`

  summary += `Cost Comparison:\n`
  summary += `• Price Range: ${money(priceRange.min)} - ${money(priceRange.max)} (Avg: ${money(avgPrice)})\n`
  summary += `• Copay Range: ${money(copayRange.min)} - ${money(copayRange.max)} (Avg: ${money(avgCopay)})\n`
  summary += `• Potential Copay Savings: ${money(copayRange.max - copayRange.min)} per fill\n\n`

  if (bestRanked) {
    summary += `Ranking & Rebate Position:\n`
    summary += `• Best Ranking Position: ${bestRanked.company} at ${bestRanked.positionLabel || `Rank ${bestRanked.preferredRank} of ${bestRanked.totalDrugsOnTier}`}\n`
    if (bestRanked.competingDrugs && bestRanked.competingDrugs.length > 0) {
      summary += `• Main Competitors on Tier: ${bestRanked.competingDrugs.join(", ")}\n`
    }
    if (bestRanked.rebateImplication) {
      summary += `• Rebate Implication: ${bestRanked.rebateImplication}\n`
    }
    summary += `\n`
  }

  summary += `Recommendation:\n`
  summary += `• ${bestCoveredOption.company} offers the strongest overall value based on coverage and member cost`
  if (bestCoveredOption.formularyAccessStatus) {
    summary += `, with ${bestCoveredOption.formularyAccessStatus.toLowerCase()} access status`
  }
  if (bestCoveredOption.positionLabel) {
    summary += ` and ranking position ${bestCoveredOption.positionLabel}`
  }
  summary += `.\n`

  if (priorAuthCompanies.length > 0 || stepTherapyCompanies.length > 0) {
    summary += `• Some payers require additional utilization management steps, which may delay access or increase administrative burden.\n`
  }

  return summary
}

export async function POST(req: Request) {
  try {
    const { drugName, comparisonData } = await req.json()

    if (!drugName || !Array.isArray(comparisonData)) {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 }
      )
    }

    const summary = generateAnalysisSummary(drugName, comparisonData)

    return Response.json({ summary })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to generate summary." },
      { status: 500 }
    )
  }
}