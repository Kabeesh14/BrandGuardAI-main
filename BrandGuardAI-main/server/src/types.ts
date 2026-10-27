export type ContentType =
  | 'Social Media'
  | 'Advertisement'
  | 'Website Copy'
  | 'Email'
  | 'Press Release';

export type Severity = 'High' | 'Medium' | 'Low';

export type FindingCategory =
  | 'Factual Accuracy'
  | 'Unsupported Claim'
  | 'Brand Voice'
  | 'Slogan Violation'
  | 'Prohibited Phrase'
  | 'Missing Disclaimer'
  | 'Guideline Violation'
  | 'Restricted Claim'
  | 'Visual Identity'
  | 'Accessibility';

export type FindingStatus = 'Open' | 'Resolved' | 'Ignored';

export interface Finding {
  id: string;
  title: string;
  category: FindingCategory;
  severity: Severity;
  problematicText?: string;
  explanation: string;
  brandRule: string;
  evidence?: string;
  recommendation: string;
  suggestedFix?: string;
  status: FindingStatus;
  simulated: boolean;
}

export type AuditStatus =
  | 'Draft'
  | 'Audited'
  | 'Changes Required'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected';

export interface AuditRevision {
  id: string;
  content: string;
  createdAt: string;
  note: string;
  source: 'initial' | 'edit' | 'suggestion' | 'rerun';
}

export interface Audit {
  id: string;
  title: string;
  campaign: string;
  contentType: ContentType;
  content: string;
  revisedContent: string;
  referenceUrl?: string;
  brandId: string;
  brandName: string;
  imageUrl?: string;
  imageName?: string;
  status: AuditStatus;
  riskScore: number;
  complianceStatus: 'Compliant' | 'Mostly Compliant' | 'Non-Compliant';
  summary: string;
  findings: Finding[];
  revisions: AuditRevision[];
  submitter: string;
  reviewer?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
  auditedAt?: string;
  reviewedAt?: string;
  simulated: boolean;
}

export interface ApprovedFact {
  id: string;
  claim: string;
  source: string;
  category: string;
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export interface BrandGuidelines {
  id: string;
  brandId: string;
  description: string;
  approvedSlogans: string[];
  voiceAndTone: string[];
  preferredWords: string[];
  prohibitedWords: string[];
  approvedFacts: ApprovedFact[];
  restrictedClaims: string[];
  requiredDisclaimers: string[];
  logoRules: string[];
  brandColors: BrandColor[];
  accessibilityRequirements: string[];
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ApprovalEvent {
  id: string;
  auditId: string;
  action: 'approve' | 'request-changes' | 'reject';
  reviewer: string;
  comment: string;
  createdAt: string;
}

export type DemoRole = 'Content Creator' | 'Reviewer' | 'Administrator';

export interface AppSettings {
  demoMode: boolean;
  geminiConfigured: boolean;
  mysqlConfigured: boolean;
  currentRole: DemoRole;
  currentUser: string;
}
