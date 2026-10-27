import type {
  Audit,
  BrandGuidelines,
  Finding,
  Severity,
} from '../types.js';

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function severityWeight(s: Severity): number {
  return s === 'High' ? 22 : s === 'Medium' ? 12 : 5;
}

function makeFinding(
  f: Omit<Finding, 'id' | 'status' | 'simulated'>
): Finding {
  return {
    ...f,
    id: uid('find'),
    status: 'Open',
    simulated: true,
  };
}

/**
 * Deterministic audit engine. Checks content against a brand's guidelines
 * when Gemini AI is not active or as an offline fallback.
 */
export function runDemoAudit(
  content: string,
  guidelines: BrandGuidelines
): { findings: Finding[]; riskScore: number; summary: string; complianceStatus: Audit['complianceStatus'] } {
  const findings: Finding[] = [];
  const text = content;
  const lower = text.toLowerCase();

  // 1. Prohibited words
  for (const word of guidelines.prohibitedWords || []) {
    const w = word.toLowerCase();
    if (lower.includes(w)) {
      findings.push(
        makeFinding({
          title: `Prohibited phrase: "${word}"`,
          category: 'Prohibited Phrase',
          severity: 'High',
          problematicText: word,
          explanation: `"${word}" is on the prohibited words list and must not appear in published content.`,
          brandRule: 'Prohibited words and phrases must not appear in any content.',
          recommendation: `Remove "${word}" or replace it with approved, brand-safe language.`,
          suggestedFix: 'an approved alternative',
        })
      );
    }
  }

  // 2. Unsupported superlatives
  const superlatives = ['best', 'number one', 'world-leading', 'world leading', '#1', 'the only', 'unmatched', 'revolutionary'];
  for (const sup of superlatives) {
    if (lower.includes(sup.toLowerCase())) {
      findings.push(
        makeFinding({
          title: `Unsupported superlative: "${sup}"`,
          category: 'Unsupported Claim',
          severity: 'Medium',
          problematicText: sup,
          explanation: `"${sup}" is a superlative claim. It requires verified third-party evidence, which was not provided.`,
          brandRule:
            'Superlatives such as "best", "number one", or "world-leading" require verified third-party evidence.',
          recommendation: 'Replace with a factual, supportable statement or attach verified evidence.',
          suggestedFix: 'a leading enterprise platform',
        })
      );
    }
  }

  // 3. Unapproved slogans
  const sloganPattern = /Technology That Moves You [A-Za-z]+/gi;
  const matches = text.match(sloganPattern) || [];
  for (const match of matches) {
    if (!(guidelines.approvedSlogans || []).some((s) => s.toLowerCase() === match.toLowerCase())) {
      findings.push(
        makeFinding({
          title: `Unapproved slogan: "${match}"`,
          category: 'Slogan Violation',
          severity: 'High',
          problematicText: match,
          explanation: `"${match}" is not on the approved slogans list. Only approved slogans may be used in customer-facing content.`,
          brandRule: 'Only approved slogans may be used in published content.',
          recommendation: `Replace with an approved slogan such as "${guidelines.approvedSlogans?.[0] ?? 'Technology That Moves You Forward'}".`,
          suggestedFix: guidelines.approvedSlogans?.[0] ?? 'Technology That Moves You Forward',
        })
      );
    }
  }

  // 4. Unsupported numerical claims
  const numberPattern = /(\d[\d,]*)\s*(%|percent|customers|regions|off|years|months|days|users|countries)/gi;
  const numMatches = text.matchAll(numberPattern);
  const approvedNumbers = new Set<string>();
  for (const fact of guidelines.approvedFacts || []) {
    const nums = fact.claim.match(/\d[\d,]*/g) || [];
    nums.forEach((n) => approvedNumbers.add(n.replace(/,/g, '')));
  }

  for (const match of numMatches) {
    const rawNum = match[1].replace(/,/g, '');
    if (!approvedNumbers.has(rawNum)) {
      const phrase = match[0];
      findings.push(
        makeFinding({
          title: `Potentially unsupported numerical claim: "${phrase}"`,
          category: 'Unsupported Claim',
          severity: 'High',
          problematicText: phrase,
          explanation: `The claim "${phrase}" does not match any approved reference fact. It should not be treated as confirmed without evidence.`,
          brandRule:
            'Numerical claims must reference an approved fact or cite supporting evidence.',
          recommendation:
            'Attach an approved reference fact or supporting evidence, or replace with a verified figure.',
          suggestedFix: 'a verified, evidence-backed figure',
        })
      );
    }
  }

  // 5. Tone mismatch
  const casualMarkers = ['hey guys', 'hi friends', "we've got", 'practically giving', 'no catch', 'killer', 'insane'];
  let toneHits = 0;
  for (const marker of casualMarkers) {
    if (lower.includes(marker.toLowerCase())) toneHits++;
  }
  if (toneHits >= 1) {
    findings.push(
      makeFinding({
        title: 'Brand voice tone mismatch',
        category: 'Brand Voice',
        severity: toneHits >= 2 ? 'Medium' : 'Low',
        problematicText: casualMarkers
          .filter((m) => lower.includes(m.toLowerCase()))
          .join(', '),
        explanation: `The content contains casual language that does not match the brand voice: ${(guidelines.voiceAndTone || []).join(', ')}.`,
        brandRule: 'Brand voice must be professional, clear, helpful, and confident.',
        recommendation: 'Rewrite using a professional, confident tone.',
        suggestedFix: 'Hello from our team,',
      })
    );
  }

  // 6. Missing disclaimer
  const promoMarkers = ['% off', 'percent off', 'deal', 'offer', 'discount', 'promo', 'sale'];
  const hasPromo = promoMarkers.some((m) => lower.includes(m));
  const hasDisclaimer = (guidelines.requiredDisclaimers || []).some((d) =>
    lower.includes(d.toLowerCase().slice(0, 20))
  );
  if (hasPromo && !hasDisclaimer) {
    findings.push(
      makeFinding({
        title: 'Missing mandatory disclaimer for promotional offer',
        category: 'Missing Disclaimer',
        severity: 'High',
        problematicText: promoMarkers.filter((m) => lower.includes(m)).join(', '),
        explanation:
          'A promotional offer is present but the required disclaimer is missing. Promotional content must include the applicable required disclaimer.',
        brandRule:
          'Applicable promotional offers must include the required disclaimer.',
        recommendation: `Add the following disclaimer: "${guidelines.requiredDisclaimers?.[0] ?? ''}"`,
        suggestedFix: guidelines.requiredDisclaimers?.[0] ?? '',
      })
    );
  }

  // Compute risk score
  const totalWeight = findings.reduce((sum, f) => sum + severityWeight(f.severity), 0);
  const riskScore = clamp(totalWeight);

  let complianceStatus: Audit['complianceStatus'];
  if (riskScore <= 20) complianceStatus = 'Compliant';
  else if (riskScore <= 50) complianceStatus = 'Mostly Compliant';
  else complianceStatus = 'Non-Compliant';

  const highCount = findings.filter((f) => f.severity === 'High').length;
  const medCount = findings.filter((f) => f.severity === 'Medium').length;
  const summary =
    findings.length === 0
      ? 'No issues detected. Content aligns with current brand guidelines and approved facts.'
      : `${findings.length} finding${findings.length === 1 ? '' : 's'} detected (${highCount} high, ${medCount} medium). ${complianceStatus} content — review and address highlighted issues before publication.`;

  return { findings, riskScore, summary, complianceStatus };
}
