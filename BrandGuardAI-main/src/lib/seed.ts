import type {
  Audit,
  Brand,
  BrandGuidelines,
  ApprovalEvent,
} from './types';

export const SEED_BRANDS: Brand[] = [
  {
    id: 'brand-novatech',
    name: 'NovaTech',
    description:
      'NovaTech is an enterprise cloud infrastructure company delivering reliable, scalable platforms for modern data-driven teams.',
    createdAt: '2026-09-01T10:00:00.000Z',
  },
];

export const SEED_GUIDELINES: BrandGuidelines[] = [
  {
    id: 'guide-novatech',
    brandId: 'brand-novatech',
    description:
      'NovaTech communications must be professional, evidence-backed, and confident. Promotional superlatives require approved supporting evidence.',
    approvedSlogans: [
      'Technology That Moves You Forward',
      'Built for What Comes Next',
    ],
    voiceAndTone: [
      'Professional',
      'Clear',
      'Helpful',
      'Confident',
    ],
    preferredWords: ['reliable', 'scalable', 'proven', 'enterprise-grade'],
    prohibitedWords: ['cheap', 'hack', 'free forever', 'killer', 'insane'],
    approvedFacts: [
      {
        id: 'fact-1',
        claim: 'NovaTech serves over 12,000 enterprise customers worldwide.',
        source: 'NovaTech Annual Report 2025',
        category: 'Customer Base',
      },
      {
        id: 'fact-2',
        claim: 'NovaTech platform uptime is 99.99% measured over the last 12 months.',
        source: 'NovaTech SLA Dashboard Q2 2026',
        category: 'Reliability',
      },
      {
        id: 'fact-3',
        claim: 'NovaTech operates data centers in 14 regions across 4 continents.',
        source: 'NovaTech Infrastructure Overview 2026',
        category: 'Infrastructure',
      },
    ],
    restrictedClaims: [
      'Numerical claims must reference an approved fact or cite supporting evidence.',
      'Superlatives such as "best", "number one", or "world-leading" require verified third-party evidence.',
      'Promotional offers must include the applicable required disclaimer.',
    ],
    requiredDisclaimers: [
      'Promotional pricing: Offer valid for new customers only. Terms and conditions apply.',
      'Performance claims: Results may vary based on workload and configuration.',
    ],
    logoRules: [
      'Logo must maintain clear space equal to the height of the wordmark.',
      'Logo minimum width on digital assets is 120px.',
      'Do not recolor the logo or place it on low-contrast backgrounds.',
    ],
    brandColors: [
      { name: 'Nova Navy', hex: '#0B1F3A', usage: 'Primary text and headers' },
      { name: 'Indigo Accent', hex: '#4F46E5', usage: 'Buttons and highlights' },
      { name: 'Cloud White', hex: '#FFFFFF', usage: 'Backgrounds' },
      { name: 'Slate', hex: '#475569', usage: 'Secondary text' },
    ],
    accessibilityRequirements: [
      'Body text contrast ratio must be at least 4.5:1 against the background.',
      'Interactive elements must have a visible focus indicator.',
      'Images must include descriptive alt text.',
    ],
  },
];

export const SEED_SAMPLE_CONTENT = {
  title: 'NovaTech Q4 Launch Promo',
  campaign: 'Q4 Acquisition Campaign',
  contentType: 'Advertisement' as const,
  brandId: 'brand-novatech',
  referenceUrl: 'https://novatech.example.com/q4-promo',
  content: `NovaTech is the #1 cloud platform in the world — and we're practically giving it away!

Our new Q4 deal gives you 90% off all enterprise plans. That's right — cheap, fast, and unstoppable.

Technology That Moves You Backward.

Join 50,000 happy customers and switch today. No fine print, no limits, no catch.`,
};

const SEED_AUDIT_1_ID = 'audit-seed-1';
const SEED_AUDIT_2_ID = 'audit-seed-2';
const SEED_AUDIT_3_ID = 'audit-seed-3';
const SEED_AUDIT_4_ID = 'audit-seed-4';

export const SEED_AUDITS: Audit[] = [
  {
    id: SEED_AUDIT_1_ID,
    title: 'NovaTech Reliability Banner Ad',
    campaign: 'Always-On Awareness',
    contentType: 'Advertisement',
    content:
      'NovaTech delivers 99.99% uptime so your team never misses a beat. Technology That Moves You Forward.',
    revisedContent:
      'NovaTech delivers 99.99% uptime so your team never misses a beat. Technology That Moves You Forward.',
    referenceUrl: 'https://novatech.example.com/reliability',
    brandId: 'brand-novatech',
    brandName: 'NovaTech',
    status: 'Approved',
    riskScore: 8,
    complianceStatus: 'Compliant',
    summary:
      'Content aligns with approved facts and brand voice. No disclaimers required for this non-promotional message.',
    findings: [],
    revisions: [
      {
        id: 'rev-seed1-1',
        content:
          'NovaTech delivers 99.99% uptime so your team never misses a beat. Technology That Moves You Forward.',
        createdAt: '2026-10-10T14:20:00.000Z',
        note: 'Initial submission',
        source: 'initial',
      },
    ],
    submitter: 'Alex Chen',
    reviewer: 'Jordan Patel',
    reviewComment: 'Clean copy, approved facts. Good to go.',
    createdAt: '2026-10-09T09:15:00.000Z',
    updatedAt: '2026-10-10T14:25:00.000Z',
    auditedAt: '2026-10-09T09:20:00.000Z',
    reviewedAt: '2026-10-10T14:25:00.000Z',
    simulated: true,
  },
  {
    id: SEED_AUDIT_2_ID,
    title: 'Summer Social Carousel',
    campaign: 'Summer Brand Push',
    contentType: 'Social Media',
    content:
      'NovaTech is the world-leading cloud platform! Our insane summer deal: 80% off everything. Cheap, fast, killer support.',
    revisedContent:
      'NovaTech is a leading enterprise cloud platform. Our summer offer: save up to 80% on selected plans. Reliable, fast, with proven support. Offer valid for new customers only. Terms and conditions apply.',
    referenceUrl: '',
    brandId: 'brand-novatech',
    brandName: 'NovaTech',
    status: 'Pending Approval',
    riskScore: 42,
    complianceStatus: 'Mostly Compliant',
    summary:
      'Initial submission contained prohibited words and an unsupported superlative. Revised content addresses most issues; disclaimer now included.',
    findings: [
      {
        id: 'find-seed2-1',
        title: 'Unsupported superlative',
        category: 'Unsupported Claim',
        severity: 'Medium',
        problematicText: 'world-leading cloud platform',
        explanation:
          'The phrase "world-leading" is a superlative claim that requires verified third-party evidence, which was not provided.',
        brandRule:
          'Superlatives such as "best", "number one", or "world-leading" require verified third-party evidence.',
        recommendation:
          'Replace with a factual, supportable statement such as "a leading enterprise cloud platform".',
        suggestedFix: 'a leading enterprise cloud platform',
        status: 'Resolved',
        simulated: true,
      },
    ],
    revisions: [
      {
        id: 'rev-seed2-1',
        content:
          'NovaTech is the world-leading cloud platform! Our insane summer deal: 80% off everything. Cheap, fast, killer support.',
        createdAt: '2026-10-15T11:00:00.000Z',
        note: 'Initial submission',
        source: 'initial',
      },
      {
        id: 'rev-seed2-2',
        content:
          'NovaTech is a leading enterprise cloud platform. Our summer offer: save up to 80% on selected plans. Reliable, fast, with proven support. Offer valid for new customers only. Terms and conditions apply.',
        createdAt: '2026-10-15T11:30:00.000Z',
        note: 'Applied suggestions + added disclaimer',
        source: 'suggestion',
      },
    ],
    submitter: 'Riya Shah',
    reviewer: 'Jordan Patel',
    createdAt: '2026-10-15T10:55:00.000Z',
    updatedAt: '2026-10-15T11:35:00.000Z',
    auditedAt: '2026-10-15T11:05:00.000Z',
    simulated: true,
  },
  {
    id: SEED_AUDIT_3_ID,
    title: 'Customer Newsletter — October',
    campaign: 'Monthly Newsletter',
    contentType: 'Email',
    content:
      'Hi friends, NovaTech here! Weve got the best deals and our platform is basically free forever. Sign up now, no catch!',
    revisedContent:
      'Hi friends, NovaTech here! Weve got the best deals and our platform is basically free forever. Sign up now, no catch!',
    referenceUrl: '',
    brandId: 'brand-novatech',
    brandName: 'NovaTech',
    status: 'Changes Required',
    riskScore: 71,
    complianceStatus: 'Non-Compliant',
    summary:
      'Multiple prohibited phrases detected ("free forever", "no catch") and an unsupported superlative ("best"). Tone is overly casual for NovaTech brand voice.',
    findings: [
      {
        id: 'find-seed3-1',
        title: 'Prohibited phrase: "free forever"',
        category: 'Prohibited Phrase',
        severity: 'High',
        problematicText: 'free forever',
        explanation:
          '"free forever" is on the NovaTech prohibited words list because it implies an open-ended commitment the company cannot guarantee.',
        brandRule: 'Prohibited words and phrases must not appear in any content.',
        recommendation: 'Remove the phrase or replace with a specific, time-bound offer.',
        suggestedFix: 'available at no cost for the first 90 days',
        status: 'Open',
        simulated: true,
      },
      {
        id: 'find-seed3-2',
        title: 'Unsupported superlative: "best"',
        category: 'Unsupported Claim',
        severity: 'Medium',
        problematicText: 'best deals',
        explanation:
          '"best" is a superlative that requires verified third-party evidence, which was not provided.',
        brandRule:
          'Superlatives such as "best", "number one", or "world-leading" require verified third-party evidence.',
        recommendation: 'Replace with a specific, evidence-backed descriptor.',
        suggestedFix: 'competitive deals',
        status: 'Open',
        simulated: true,
      },
      {
        id: 'find-seed3-3',
        title: 'Tone mismatch: overly casual',
        category: 'Brand Voice',
        severity: 'Medium',
        problematicText: 'Hi friends, NovaTech here!',
        explanation:
          'The greeting is overly casual. NovaTech brand voice is professional, clear, helpful, and confident.',
        brandRule: 'Brand voice must be professional, clear, helpful, and confident.',
        recommendation: 'Use a professional greeting such as "Hello from the NovaTech team."',
        suggestedFix: 'Hello from the NovaTech team,',
        status: 'Open',
        simulated: true,
      },
    ],
    revisions: [
      {
        id: 'rev-seed3-1',
        content:
          'Hi friends, NovaTech here! Weve got the best deals and our platform is basically free forever. Sign up now, no catch!',
        createdAt: '2026-10-20T08:00:00.000Z',
        note: 'Initial submission',
        source: 'initial',
      },
    ],
    submitter: 'Alex Chen',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-20T08:10:00.000Z',
    auditedAt: '2026-10-20T08:05:00.000Z',
    simulated: true,
  },
  {
    id: SEED_AUDIT_4_ID,
    title: 'Press Release — Q3 Results',
    campaign: 'Quarterly PR',
    contentType: 'Press Release',
    content:
      'NovaTech, a leading enterprise cloud platform, today announced Q3 results. The company serves over 12,000 enterprise customers and operates data centers in 14 regions. Technology That Moves You Forward.',
    revisedContent:
      'NovaTech, a leading enterprise cloud platform, today announced Q3 results. The company serves over 12,000 enterprise customers and operates data centers in 14 regions. Technology That Moves You Forward.',
    referenceUrl: 'https://novatech.example.com/press/q3',
    brandId: 'brand-novatech',
    brandName: 'NovaTech',
    status: 'Approved',
    riskScore: 5,
    complianceStatus: 'Compliant',
    summary:
      'All claims map to approved reference facts. Approved slogan used correctly. No disclaimers required.',
    findings: [],
    revisions: [
      {
        id: 'rev-seed4-1',
        content:
          'NovaTech, a leading enterprise cloud platform, today announced Q3 results. The company serves over 12,000 enterprise customers and operates data centers in 14 regions. Technology That Moves You Forward.',
        createdAt: '2026-10-22T16:00:00.000Z',
        note: 'Initial submission',
        source: 'initial',
      },
    ],
    submitter: 'Riya Shah',
    reviewer: 'Jordan Patel',
    reviewComment: 'All facts verified. Approved.',
    createdAt: '2026-10-22T15:50:00.000Z',
    updatedAt: '2026-10-22T16:30:00.000Z',
    auditedAt: '2026-10-22T15:55:00.000Z',
    reviewedAt: '2026-10-22T16:30:00.000Z',
    simulated: true,
  },
];

export const SEED_APPROVAL_EVENTS: ApprovalEvent[] = [
  {
    id: 'apv-1',
    auditId: SEED_AUDIT_1_ID,
    action: 'approve',
    reviewer: 'Jordan Patel',
    comment: 'Clean copy, approved facts. Good to go.',
    createdAt: '2026-10-10T14:25:00.000Z',
  },
  {
    id: 'apv-2',
    auditId: SEED_AUDIT_4_ID,
    action: 'approve',
    reviewer: 'Jordan Patel',
    comment: 'All facts verified. Approved.',
    createdAt: '2026-10-22T16:30:00.000Z',
  },
];
