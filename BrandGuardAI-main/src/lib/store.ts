import { useSyncExternalStore } from 'react';
import type {
  AppSettings,
  Audit,
  AuditStatus,
  ApprovalEvent,
  Brand,
  BrandGuidelines,
  DemoRole,
  Finding,
} from './types';
import {
  SEED_APPROVAL_EVENTS,
  SEED_AUDITS,
  SEED_BRANDS,
  SEED_GUIDELINES,
} from './seed';
import { runDemoAudit } from './auditEngine';
import { api, type HealthResponse } from './api';

const STORAGE_KEY = 'brandguard-state-v1';

export interface State {
  brands: Brand[];
  guidelines: BrandGuidelines[];
  audits: Audit[];
  approvalEvents: ApprovalEvent[];
  settings: AppSettings;
  health: HealthResponse | null;
  serverOnline: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  demoMode: true,
  geminiConfigured: false,
  mysqlConfigured: false,
  currentRole: 'Content Creator',
  currentUser: 'Alex Chen',
};

function freshState(): State {
  return {
    brands: structuredClone(SEED_BRANDS),
    guidelines: structuredClone(SEED_GUIDELINES),
    audits: structuredClone(SEED_AUDITS),
    approvalEvents: structuredClone(SEED_APPROVAL_EVENTS),
    settings: { ...DEFAULT_SETTINGS },
    health: null,
    serverOnline: false,
  };
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<State>;
    const base = freshState();
    return {
      brands: parsed.brands ?? base.brands,
      guidelines: parsed.guidelines ?? base.guidelines,
      audits: parsed.audits ?? base.audits,
      approvalEvents: parsed.approvalEvents ?? base.approvalEvents,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      health: null,
      serverOnline: false,
    };
  } catch {
    return freshState();
  }
}

let state: State = loadState();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        brands: state.brands,
        guidelines: state.guidelines,
        audits: state.audits,
        approvalEvents: state.approvalEvents,
        settings: state.settings,
      })
    );
  } catch {
    // ignore quota errors
  }
}

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot())
  );
}

export function getState(): State {
  return state;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function reviewerName(): string {
  if (state.settings.currentRole === 'Reviewer') return state.settings.currentUser;
  return 'Jordan Patel';
}

// ---- Backend Sync & Hydration ----
export async function syncFromBackend() {
  try {
    const health = await api.getHealth();
    if (health) {
      // Ensure we have an authenticated token for server API calls
      if (typeof window !== 'undefined' && (!api.getAuthToken() || !localStorage.getItem('brandguard_auth_token'))) {
        await api.fetchSessionToken(state.settings.currentRole, state.settings.currentUser);
      }

      const [brands, guidelines, audits, events] = await Promise.all([
        api.getBrands(),
        api.getGuidelines(),
        api.getAudits(),
        api.getApprovalEvents(),
      ]);

      setState({
        serverOnline: true,
        health,
        settings: {
          ...state.settings,
          demoMode: !health.services.gemini.configured,
          geminiConfigured: health.services.gemini.configured,
          mysqlConfigured: health.services.mysql.configured,
        },
        brands: brands && brands.length > 0 ? brands : state.brands,
        guidelines: guidelines && guidelines.length > 0 ? guidelines : state.guidelines,
        audits: audits && audits.length > 0 ? audits : state.audits,
        approvalEvents: events && events.length > 0 ? events : state.approvalEvents,
      });
      return true;
    }
  } catch (err) {
    console.warn('[Sync] Could not reach backend, maintaining offline mode:', err);
  }
  return false;
}

// Trigger initial backend sync on load
if (typeof window !== 'undefined') {
  syncFromBackend();
}

// ---- Settings ----
export function setRole(role: DemoRole) {
  const userMap: Record<DemoRole, string> = {
    'Content Creator': 'Alex Chen',
    Reviewer: 'Jordan Patel',
    Administrator: 'Sam Rivera',
  };
  const userName = userMap[role];
  setState({ settings: { ...state.settings, currentRole: role, currentUser: userName } });
  
  // Obtain verified server-side session token for this role
  api.fetchSessionToken(role, userName).catch(() => {});
}

export function resetDemoData() {
  api.resetData().catch(() => {});
  setState(freshState());
}

// ---- Audits ----
export interface NewAuditInput {
  title: string;
  campaign: string;
  contentType: Audit['contentType'];
  content: string;
  referenceUrl?: string;
  brandId: string;
  imageUrl?: string;
  imageName?: string;
}

export function createAudit(input: NewAuditInput): Audit {
  const brand = state.brands.find((b) => b.id === input.brandId);
  const audit: Audit = {
    id: uid('audit'),
    title: input.title,
    campaign: input.campaign,
    contentType: input.contentType,
    content: input.content,
    revisedContent: input.content,
    referenceUrl: input.referenceUrl,
    brandId: input.brandId,
    brandName: brand?.name ?? 'Unknown',
    imageUrl: input.imageUrl,
    imageName: input.imageName,
    status: 'Draft',
    riskScore: 0,
    complianceStatus: 'Compliant',
    summary: '',
    findings: [],
    revisions: [
      {
        id: uid('rev'),
        content: input.content,
        createdAt: nowISO(),
        note: 'Initial submission',
        source: 'initial',
      },
    ],
    submitter: state.settings.currentUser,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    simulated: true,
  };

  setState({ audits: [audit, ...state.audits] });

  // Sync with backend
  api.createAudit({
    ...input,
    submitter: state.settings.currentUser,
  }).then((serverAudit) => {
    if (serverAudit) {
      setState({
        audits: state.audits.map((a) => (a.id === audit.id ? serverAudit : a)),
      });
    }
  }).catch(() => {});

  return audit;
}

export function getAudit(id: string): Audit | undefined {
  return state.audits.find((a) => a.id === id);
}

export async function runAuditAsync(auditId: string): Promise<Audit | undefined> {
  // First run local optimistic audit
  let current = runAudit(auditId);
  if (!current) return undefined;

  // Then invoke backend audit (Gemini AI or fallback)
  try {
    const serverResult = await api.runAudit(auditId);
    if (serverResult) {
      setState({
        audits: state.audits.map((a) => (a.id === auditId ? serverResult : a)),
      });
      return serverResult;
    }
  } catch (err) {
    console.warn('[runAuditAsync] Backend audit call failed, using local result:', err);
  }
  return current;
}

export function runAudit(auditId: string): Audit | undefined {
  const audit = state.audits.find((a) => a.id === auditId);
  if (!audit) return undefined;
  const guidelines = state.guidelines.find((g) => g.brandId === audit.brandId);
  if (!guidelines) return undefined;

  const { findings, riskScore, summary, complianceStatus } = runDemoAudit(
    audit.revisedContent,
    guidelines
  );

  const updated: Audit = {
    ...audit,
    findings,
    riskScore,
    summary,
    complianceStatus,
    status: 'Audited',
    auditedAt: nowISO(),
    updatedAt: nowISO(),
    simulated: true,
  };

  setState({
    audits: state.audits.map((a) => (a.id === auditId ? updated : a)),
  });

  // Background trigger server audit if backend is online
  api.runAudit(auditId).then((serverAudit) => {
    if (serverAudit) {
      setState({
        audits: state.audits.map((a) => (a.id === auditId ? serverAudit : a)),
      });
    }
  }).catch(() => {});

  return updated;
}

export function updateRevisedContent(
  auditId: string,
  revisedContent: string,
  note: string,
  source: Audit['revisions'][number]['source']
) {
  const audit = state.audits.find((a) => a.id === auditId);
  if (!audit) return;
  const updated: Audit = {
    ...audit,
    revisedContent,
    updatedAt: nowISO(),
    revisions: [
      ...audit.revisions,
      { id: uid('rev'), content: revisedContent, createdAt: nowISO(), note, source },
    ],
  };
  setState({ audits: state.audits.map((a) => (a.id === auditId ? updated : a)) });
  api.updateRevision(auditId, revisedContent, note, source).catch(() => {});
}

export function setFindingStatus(auditId: string, findingId: string, status: Finding['status']) {
  const audit = state.audits.find((a) => a.id === auditId);
  if (!audit) return;
  const updated: Audit = {
    ...audit,
    findings: audit.findings.map((f) => (f.id === findingId ? { ...f, status } : f)),
    updatedAt: nowISO(),
  };
  setState({ audits: state.audits.map((a) => (a.id === auditId ? updated : a)) });
  api.updateFindingStatus(auditId, findingId, status).catch(() => {});
}

export function submitForApproval(auditId: string) {
  const audit = state.audits.find((a) => a.id === auditId);
  if (!audit) return;
  const updated: Audit = {
    ...audit,
    status: 'Pending Approval' as AuditStatus,
    updatedAt: nowISO(),
  };
  setState({ audits: state.audits.map((a) => (a.id === auditId ? updated : a)) });
  api.handleApproval(auditId, 'submit').catch(() => {});
}

// ---- Review ----
export function approveAudit(auditId: string, comment: string) {
  const audit = state.audits.find((a) => a.id === auditId);
  if (!audit) return;
  const reviewer = reviewerName();
  const event: ApprovalEvent = {
    id: uid('apv'),
    auditId,
    action: 'approve',
    reviewer,
    comment,
    createdAt: nowISO(),
  };
  const updated: Audit = {
    ...audit,
    status: 'Approved',
    reviewer,
    reviewComment: comment,
    reviewedAt: nowISO(),
    updatedAt: nowISO(),
  };
  setState({
    audits: state.audits.map((a) => (a.id === auditId ? updated : a)),
    approvalEvents: [event, ...state.approvalEvents],
  });
  api.handleApproval(auditId, 'approve', reviewer, comment).catch(() => {});
}

export function requestChanges(auditId: string, comment: string) {
  const audit = state.audits.find((a) => a.id === auditId);
  if (!audit) return;
  const reviewer = reviewerName();
  const event: ApprovalEvent = {
    id: uid('apv'),
    auditId,
    action: 'request-changes',
    reviewer,
    comment,
    createdAt: nowISO(),
  };
  const updated: Audit = {
    ...audit,
    status: 'Changes Required',
    reviewer,
    reviewComment: comment,
    reviewedAt: nowISO(),
    updatedAt: nowISO(),
  };
  setState({
    audits: state.audits.map((a) => (a.id === auditId ? updated : a)),
    approvalEvents: [event, ...state.approvalEvents],
  });
  api.handleApproval(auditId, 'request-changes', reviewer, comment).catch(() => {});
}

export function rejectAudit(auditId: string, comment: string) {
  const audit = state.audits.find((a) => a.id === auditId);
  if (!audit) return;
  const reviewer = reviewerName();
  const event: ApprovalEvent = {
    id: uid('apv'),
    auditId,
    action: 'reject',
    reviewer,
    comment,
    createdAt: nowISO(),
  };
  const updated: Audit = {
    ...audit,
    status: 'Rejected',
    reviewer,
    reviewComment: comment,
    reviewedAt: nowISO(),
    updatedAt: nowISO(),
  };
  setState({
    audits: state.audits.map((a) => (a.id === auditId ? updated : a)),
    approvalEvents: [event, ...state.approvalEvents],
  });
  api.handleApproval(auditId, 'reject', reviewer, comment).catch(() => {});
}

// ---- Guidelines ----
export function saveGuidelines(g: BrandGuidelines) {
  const exists = state.guidelines.some((x) => x.id === g.id);
  setState({
    guidelines: exists
      ? state.guidelines.map((x) => (x.id === g.id ? g : x))
      : [...state.guidelines, g],
  });
  api.saveGuidelines(g).catch(() => {});
}

export function deleteGuidelines(id: string) {
  setState({ guidelines: state.guidelines.filter((g) => g.id !== id) });
}

export function addBrand(name: string, description: string): Brand {
  const brand: Brand = {
    id: uid('brand'),
    name,
    description,
    createdAt: nowISO(),
  };
  const guidelines: BrandGuidelines = {
    id: uid('guide'),
    brandId: brand.id,
    description: `${name} brand guidelines.`,
    approvedSlogans: [],
    voiceAndTone: [],
    preferredWords: [],
    prohibitedWords: [],
    approvedFacts: [],
    restrictedClaims: [],
    requiredDisclaimers: [],
    logoRules: [],
    brandColors: [],
    accessibilityRequirements: [],
  };
  setState({
    brands: [...state.brands, brand],
    guidelines: [...state.guidelines, guidelines],
  });
  api.createBrand(name, description).catch(() => {});
  return brand;
}

export function deleteBrand(id: string) {
  setState({
    brands: state.brands.filter((b) => b.id !== id),
    guidelines: state.guidelines.filter((g) => g.brandId !== id),
  });
  api.deleteBrand(id).catch(() => {});
}
