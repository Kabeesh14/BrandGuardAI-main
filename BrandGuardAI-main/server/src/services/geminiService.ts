import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import type { Audit, BrandGuidelines, Finding } from '../types.js';
import { runDemoAudit } from './auditEngine.js';

let genAIClient: GoogleGenerativeAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5);
}

function getGenAI(): GoogleGenerativeAI | null {
  if (!isGeminiConfigured()) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAIClient;
}

export interface AuditRunResult {
  findings: Finding[];
  riskScore: number;
  summary: string;
  complianceStatus: Audit['complianceStatus'];
  simulated: boolean;
  modelUsed?: string;
}

export async function auditContentWithGemini(
  content: string,
  contentType: string,
  campaign: string,
  guidelines: BrandGuidelines,
  imageBase64?: string
): Promise<AuditRunResult> {
  const client = getGenAI();

  // If Gemini is not configured, seamlessly run deterministic audit
  if (!client) {
    console.log('[AuditEngine] Gemini API key not configured. Using deterministic fallback engine.');
    const demo = runDemoAudit(content, guidelines);
    return {
      ...demo,
      simulated: true,
      modelUsed: 'Deterministic Fallback Engine (Demo Mode)',
    };
  }

  try {
    const candidateModels = Array.from(
      new Set([
        env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
      ])
    );

    const systemPrompt = `You are BrandGuard AI, an expert brand compliance, legal risk, and copy editor auditor.
Audit the submitted promotional/marketing content against the provided Brand Guidelines and Approved Facts.

Brand Guidelines:
- Description: ${guidelines.description || 'N/A'}
- Approved Slogans: ${JSON.stringify(guidelines.approvedSlogans || [])}
- Approved Voice and Tone: ${JSON.stringify(guidelines.voiceAndTone || [])}
- Preferred Words: ${JSON.stringify(guidelines.preferredWords || [])}
- Prohibited Words / Phrases: ${JSON.stringify(guidelines.prohibitedWords || [])}
- Approved Facts & Metrics: ${JSON.stringify(guidelines.approvedFacts || [])}
- Restricted Claims Rules: ${JSON.stringify(guidelines.restrictedClaims || [])}
- Required Disclaimers: ${JSON.stringify(guidelines.requiredDisclaimers || [])}
- Logo Rules: ${JSON.stringify(guidelines.logoRules || [])}
- Brand Colors: ${JSON.stringify(guidelines.brandColors || [])}
- Accessibility Requirements: ${JSON.stringify(guidelines.accessibilityRequirements || [])}

Auditing Rules:
1. Flag any prohibited words or phrases as High severity.
2. Flag any superlatives (e.g. "best", "#1", "world-leading") or absolute guarantees as Unsupported Claim unless backed by approved facts.
3. Flag any statistics or numbers that conflict with or lack reference in the Approved Facts list.
4. Flag missing mandatory disclaimers for promotional discounts or claims.
5. Flag voice/tone mismatches (e.g., overly casual greetings or hype words).
6. Calculate a composite riskScore from 0 to 100:
   - 0 to 20: Compliant
   - 21 to 50: Mostly Compliant
   - 51 to 100: Non-Compliant
7. For each finding, provide:
   - title: Short descriptive title
   - category: One of ['Factual Accuracy', 'Unsupported Claim', 'Brand Voice', 'Slogan Violation', 'Prohibited Phrase', 'Missing Disclaimer', 'Guideline Violation', 'Restricted Claim', 'Visual Identity', 'Accessibility']
   - severity: 'High', 'Medium', or 'Low'
   - problematicText: The exact substring in the content that is problematic
   - explanation: Clear rationale explaining why it violates the brand guidelines
   - brandRule: The relevant rule or guideline violated
   - recommendation: Practical advice for the writer
   - suggestedFix: Exact text replacement to fix the problematicText cleanly in the copy

Respond STRICTLY in valid JSON matching this schema:
{
  "riskScore": number,
  "complianceStatus": "Compliant" | "Mostly Compliant" | "Non-Compliant",
  "summary": string,
  "findings": [
    {
      "title": string,
      "category": string,
      "severity": "High" | "Medium" | "Low",
      "problematicText": string,
      "explanation": string,
      "brandRule": string,
      "recommendation": string,
      "suggestedFix": string
    }
  ]
}`;

    const userPrompt = `Content Type: ${contentType}
Campaign: ${campaign}
Submitted Content to Audit:
"""
${content}
"""`;

    const parts: any[] = [{ text: systemPrompt }, { text: userPrompt }];

    // If an image is attached, include it for visual inspection
    if (imageBase64 && imageBase64.includes(';base64,')) {
      const [header, base64Data] = imageBase64.split(';base64,');
      const mimeMatch = header.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
      parts.push({
        text: 'Please also inspect the attached image for visual identity, logo placement, and text legibility in accordance with brand rules.',
      });
    }

    let response: any = null;
    let modelUsed = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        response = await model.generateContent(parts);
        modelUsed = modelName;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiService] Model ${modelName} call failed (${err?.message || err}). Trying next candidate...`);
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini candidate models failed');
    }

    const rawText = response.response.text();
    const parsed = JSON.parse(rawText);

    const findings: Finding[] = (parsed.findings || []).map((f: any, idx: number) => ({
      id: `find-gemini-${Date.now()}-${idx}`,
      title: f.title || 'Brand Guideline Issue',
      category: f.category || 'Guideline Violation',
      severity: f.severity || 'Medium',
      problematicText: f.problematicText || undefined,
      explanation: f.explanation || '',
      brandRule: f.brandRule || '',
      recommendation: f.recommendation || '',
      suggestedFix: f.suggestedFix || undefined,
      status: 'Open' as const,
      simulated: false,
    }));

    const riskScore = Math.max(0, Math.min(100, Math.round(parsed.riskScore ?? 0)));
    let complianceStatus: Audit['complianceStatus'] = 'Compliant';
    if (riskScore > 50) complianceStatus = 'Non-Compliant';
    else if (riskScore > 20) complianceStatus = 'Mostly Compliant';

    return {
      findings,
      riskScore,
      summary: parsed.summary || 'Gemini AI compliance analysis completed.',
      complianceStatus,
      simulated: false,
      modelUsed: modelUsed,
    };
  } catch (err: any) {
    console.error('[GeminiService] Error calling Gemini API:', err?.message || err);
    console.log('[GeminiService] Gracefully falling back to deterministic audit engine.');
    const demo = runDemoAudit(content, guidelines);
    return {
      ...demo,
      simulated: true,
      modelUsed: 'Fallback Engine (Gemini unavailable)',
    };
  }
}
