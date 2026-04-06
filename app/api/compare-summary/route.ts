import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drugName, rows } = body;

    if (!drugName || !rows || rows.length < 2) {
      return NextResponse.json(
        { error: "drugName and at least 2 rows required for comparison" },
        { status: 400 }
      );
    }

    // Check if Anthropic API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        summary: "AI summary is not configured. Please add ANTHROPIC_API_KEY to environment variables."
      }, { status: 200 });
    }

    const [leftCompany, rightCompany] = rows;

    const prompt = `Compare these two drug coverage policies for ${drugName}:

LEFT: ${leftCompany.company}
- Coverage: ${leftCompany.coverage}
- Prior Auth: ${leftCompany.criteria.priorAuthorization.status}
- Step Therapy: ${leftCompany.criteria.stepTherapy.status}
- Quantity Limit: ${leftCompany.criteria.quantityLimit}

RIGHT: ${rightCompany.company}
- Coverage: ${rightCompany.coverage}  
- Prior Auth: ${rightCompany.criteria.priorAuthorization.status}
- Step Therapy: ${rightCompany.criteria.stepTherapy.status}
- Quantity Limit: ${rightCompany.criteria.quantityLimit}

Provide a 2-3 sentence comparison of key differences. Focus on which has better access and any notable requirements.`;

    // Try different models in order of preference
    const models = [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022", 
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307"
    ];

    let completion = null;
    let lastError = null;

    for (const model of models) {
      try {
        completion = await anthropic.messages.create({
          model,
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });
        break; // Success, exit loop
      } catch (modelError: any) {
        lastError = modelError;
        console.log(`Model ${model} failed, trying next...`);
        continue;
      }
    }

    if (!completion) {
      // Fallback to a basic comparison if AI fails
      const basicComparison = generateBasicComparison(leftCompany, rightCompany, drugName);
      return NextResponse.json({ summary: basicComparison }, { status: 200 });
    }

    const summary = completion.content[0]?.type === "text" 
      ? completion.content[0].text 
      : "Unable to generate summary at this time.";

    return NextResponse.json({ summary }, { status: 200 });

  } catch (error) {
    console.error("AI Summary error:", error);
    
    // Generate a basic comparison as fallback
    try {
      const { rows, drugName } = await request.json();
      const [leftCompany, rightCompany] = rows;
      const basicComparison = generateBasicComparison(leftCompany, rightCompany, drugName);
      
      return NextResponse.json({ 
        summary: basicComparison
      }, { status: 200 });
    } catch {
      return NextResponse.json({
        summary: "Unable to generate comparison summary at this time."
      }, { status: 200 });
    }
  }
}

function generateBasicComparison(leftCompany: any, rightCompany: any, drugName: string): string {
  const leftCovered = leftCompany.coverage === "Covered";
  const rightCovered = rightCompany.coverage === "Covered";
  
  if (leftCovered && !rightCovered) {
    return `${leftCompany.company} covers ${drugName} while ${rightCompany.company} does not. ${leftCompany.company} requires ${leftCompany.criteria.priorAuthorization.status === "Required" ? "prior authorization" : "no prior authorization"}.`;
  }
  
  if (!leftCovered && rightCovered) {
    return `${rightCompany.company} covers ${drugName} while ${leftCompany.company} does not. ${rightCompany.company} requires ${rightCompany.criteria.priorAuthorization.status === "Required" ? "prior authorization" : "no prior authorization"}.`;
  }
  
  if (leftCovered && rightCovered) {
    const leftPA = leftCompany.criteria.priorAuthorization.status === "Required";
    const rightPA = rightCompany.criteria.priorAuthorization.status === "Required";
    
    if (leftPA && !rightPA) {
      return `Both companies cover ${drugName}, but ${leftCompany.company} requires prior authorization while ${rightCompany.company} does not, making ${rightCompany.company} more accessible.`;
    } else if (!leftPA && rightPA) {
      return `Both companies cover ${drugName}, but ${rightCompany.company} requires prior authorization while ${leftCompany.company} does not, making ${leftCompany.company} more accessible.`;
    } else {
      return `Both ${leftCompany.company} and ${rightCompany.company} cover ${drugName} with similar access requirements. Both ${leftPA ? "require" : "do not require"} prior authorization.`;
    }
  }
  
  return `Both companies have limited or no coverage for ${drugName}. Check individual policy documents for detailed requirements.`;
}