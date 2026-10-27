import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/repository.js';
import { auditContentWithGemini } from '../services/geminiService.js';
import { requireAuth, requireRoles } from '../auth/middleware.js';
import type { Audit, AuditStatus, Finding, ApprovalEvent, ContentType } from '../types.js';

export const auditsRouter = Router();

const createAuditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  campaign: z.string().min(1, 'Campaign is required'),
  contentType: z.enum([
    'Social Media',
    'Advertisement',
    'Website Copy',
    'Email',
    'Press Release',
  ]),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  referenceUrl: z.string().optional(),
  brandId: z.string().min(1, 'Brand is required'),
  imageUrl: z.string().optional(),
  imageName: z.string().optional(),
  submitter: z.string().optional().default('Alex Chen'),
});

// GET /api/audits
auditsRouter.get('/audits', async (req, res) => {
  try {
    const { search, status, type, severity } = req.query;
    let audits = await db.getAudits();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      audits = audits.filter(
        (a) => a.title.toLowerCase().includes(q) || a.campaign.toLowerCase().includes(q)
      );
    }
    if (status && status !== 'All') {
      audits = audits.filter((a) => a.status === status);
    }
    if (type && type !== 'All') {
      audits = audits.filter((a) => a.contentType === type);
    }
    if (severity && severity !== 'All') {
      audits = audits.filter((a) => a.findings.some((f) => f.severity === severity));
    }

    res.json(audits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audits/:id
auditsRouter.get('/audits/:id', async (req, res) => {
  try {
    const audit = await db.getAuditById(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    res.json(audit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/audits - Protected
auditsRouter.post(
  '/audits',
  requireAuth,
  requireRoles(['Content Creator', 'Reviewer', 'Administrator']),
  async (req, res) => {
    try {
      const parsed = createAuditSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' });
      }

      const { title, campaign, contentType, content, referenceUrl, brandId, imageUrl, imageName, submitter } = parsed.data;
      const brand = await db.getBrandById(brandId);
      const now = new Date().toISOString();
      const auditId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      const audit: Audit = {
        id: auditId,
        title: title.trim(),
        campaign: campaign.trim(),
        contentType: contentType as ContentType,
        content: content.trim(),
        revisedContent: content.trim(),
        referenceUrl: referenceUrl?.trim() || undefined,
        brandId,
        brandName: brand?.name || 'Unknown',
        imageUrl,
        imageName,
        status: 'Draft',
        riskScore: 0,
        complianceStatus: 'Compliant',
        summary: '',
        findings: [],
        revisions: [
          {
            id: `rev-${Date.now().toString(36)}`,
            content: content.trim(),
            createdAt: now,
            note: 'Initial submission',
            source: 'initial',
          },
        ],
        submitter: req.user?.name || submitter || 'Alex Chen',
        createdAt: now,
        updatedAt: now,
        simulated: true,
      };

      await db.saveAudit(audit);
      res.status(201).json(audit);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/audits/:id/run - Protected
auditsRouter.post(
  '/audits/:id/run',
  requireAuth,
  requireRoles(['Content Creator', 'Reviewer', 'Administrator']),
  async (req, res) => {
  try {
    const audit = await db.getAuditById(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });

    const guidelines = await db.getGuidelinesByBrandId(audit.brandId);
    if (!guidelines) return res.status(404).json({ error: 'Brand guidelines not found' });

    // Call real Gemini AI (or fallback if key not configured)
    const result = await auditContentWithGemini(
      audit.revisedContent,
      audit.contentType,
      audit.campaign,
      guidelines,
      audit.imageUrl
    );

    const now = new Date().toISOString();
    const updated: Audit = {
      ...audit,
      findings: result.findings,
      riskScore: result.riskScore,
      summary: result.summary,
      complianceStatus: result.complianceStatus,
      status: 'Audited',
      auditedAt: now,
      updatedAt: now,
      simulated: result.simulated,
    };

    await db.saveAudit(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/audits/:id/revisions - Protected
auditsRouter.put(
  '/audits/:id/revisions',
  requireAuth,
  requireRoles(['Content Creator', 'Reviewer', 'Administrator']),
  async (req, res) => {
    try {
      const { revisedContent, note, source } = req.body;
      const audit = await db.getAuditById(req.params.id);
      if (!audit) return res.status(404).json({ error: 'Audit not found' });

      const now = new Date().toISOString();
      const updated: Audit = {
        ...audit,
        revisedContent: revisedContent ?? audit.revisedContent,
        updatedAt: now,
        revisions: [
          ...audit.revisions,
          {
            id: `rev-${Date.now().toString(36)}`,
            content: revisedContent,
            createdAt: now,
            note: note || 'Content revised',
            source: source || 'edit',
          },
        ],
      };

      await db.saveAudit(updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/audits/:id/findings/:findingId - Protected (Reviewer or Administrator only)
auditsRouter.put(
  '/audits/:id/findings/:findingId',
  requireAuth,
  requireRoles(['Reviewer', 'Administrator']),
  async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['Open', 'Resolved', 'Ignored'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be Open, Resolved, or Ignored.' });
      }

      const audit = await db.getAuditById(req.params.id);
      if (!audit) return res.status(404).json({ error: 'Audit not found' });

      const findingExists = audit.findings.some((f) => f.id === req.params.findingId);
      if (!findingExists) return res.status(404).json({ error: 'Finding not found in this audit' });

      const now = new Date().toISOString();
      const updated: Audit = {
        ...audit,
        findings: audit.findings.map((f) =>
          f.id === req.params.findingId ? { ...f, status } : f
        ),
        updatedAt: now,
      };

      await db.saveAudit(updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/audits/:id/approval - Protected (Server-side RBAC)
auditsRouter.post('/audits/:id/approval', requireAuth, async (req, res) => {
  try {
    const { action, comment } = req.body as {
      action: 'submit' | 'approve' | 'request-changes' | 'reject';
      reviewer?: string;
      comment?: string;
    };

    const validActions = ['submit', 'approve', 'request-changes', 'reject'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action '${action}'. Must be submit, approve, request-changes, or reject.` });
    }

    const audit = await db.getAuditById(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });

    const now = new Date().toISOString();
    let newStatus: AuditStatus = audit.status;

    if (action === 'submit') {
      newStatus = 'Pending Approval';
      const updated: Audit = {
        ...audit,
        status: newStatus,
        updatedAt: now,
      };
      await db.saveAudit(updated);
      return res.json(updated);
    }

    // Role Enforcement: Reviewer or Administrator ONLY for approve, request-changes, or reject
    if (!['Reviewer', 'Administrator'].includes(req.user!.role)) {
      return res.status(403).json({
        error: `Forbidden: Only Reviewers or Administrators can execute approval action '${action}'. Your verified role is ${req.user!.role}.`,
      });
    }

    if (action === 'approve') newStatus = 'Approved';
    else if (action === 'request-changes') newStatus = 'Changes Required';
    else if (action === 'reject') newStatus = 'Rejected';

    // Enforce verified user name from token as reviewer
    const reviewerName = req.user!.name || 'Reviewer';

    const event: ApprovalEvent = {
      id: `apv-${Date.now().toString(36)}`,
      auditId: audit.id,
      action: action as ApprovalEvent['action'],
      reviewer: reviewerName,
      comment: comment || '',
      createdAt: now,
    };
    await db.addApprovalEvent(event);

    const updated: Audit = {
      ...audit,
      status: newStatus,
      reviewer: reviewerName,
      reviewComment: comment || undefined,
      reviewedAt: now,
      updatedAt: now,
    };

    await db.saveAudit(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/approval-events
auditsRouter.get('/approval-events', async (_req, res) => {
  try {
    const events = await db.getApprovalEvents();
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
