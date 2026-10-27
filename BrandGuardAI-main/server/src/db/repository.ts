import { getPool, isDbConnected, memoryStore } from './connection.js';
import {
  SEED_BRANDS,
  SEED_GUIDELINES,
  SEED_AUDITS,
  SEED_APPROVAL_EVENTS,
} from './seedData.js';
import type { Audit, Brand, BrandGuidelines, ApprovalEvent, Finding } from '../types.js';

export const db = {
  // ---- BRANDS ----
  async getBrands(): Promise<Brand[]> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        const [rows]: any = await pool.query('SELECT * FROM brands ORDER BY created_at DESC');
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          createdAt: r.created_at,
        }));
      } catch (e) {
        console.warn('[DB] Fallback to memory for getBrands');
      }
    }
    return memoryStore.brands;
  },

  async getBrandById(id: string): Promise<Brand | undefined> {
    const brands = await this.getBrands();
    return brands.find((b) => b.id === id);
  },

  async createBrand(brand: Brand): Promise<Brand> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        await pool.query(
          'INSERT INTO brands (id, name, description, created_at) VALUES (?, ?, ?, ?)',
          [brand.id, brand.name, brand.description, brand.createdAt]
        );
      } catch (e) {
        console.warn('[DB] Fallback to memory for createBrand');
      }
    }
    memoryStore.brands.push(brand);
    return brand;
  },

  async deleteBrand(id: string): Promise<void> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        await pool.query('DELETE FROM brands WHERE id = ?', [id]);
        await pool.query('DELETE FROM guidelines WHERE brand_id = ?', [id]);
      } catch (e) {
        console.warn('[DB] Fallback to memory for deleteBrand');
      }
    }
    memoryStore.brands = memoryStore.brands.filter((b) => b.id !== id);
    memoryStore.guidelines = memoryStore.guidelines.filter((g) => g.brandId !== id);
  },

  // ---- GUIDELINES ----
  async getGuidelines(): Promise<BrandGuidelines[]> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        const [rows]: any = await pool.query('SELECT * FROM guidelines');
        return rows.map((r: any) => ({
          id: r.id,
          brandId: r.brand_id,
          description: r.description || '',
          approvedSlogans: typeof r.approved_slogans === 'string' ? JSON.parse(r.approved_slogans) : r.approved_slogans || [],
          voiceAndTone: typeof r.voice_and_tone === 'string' ? JSON.parse(r.voice_and_tone) : r.voice_and_tone || [],
          preferredWords: typeof r.preferred_words === 'string' ? JSON.parse(r.preferred_words) : r.preferred_words || [],
          prohibitedWords: typeof r.prohibited_words === 'string' ? JSON.parse(r.prohibited_words) : r.prohibited_words || [],
          approvedFacts: typeof r.approved_facts === 'string' ? JSON.parse(r.approved_facts) : r.approved_facts || [],
          restrictedClaims: typeof r.restricted_claims === 'string' ? JSON.parse(r.restricted_claims) : r.restricted_claims || [],
          requiredDisclaimers: typeof r.required_disclaimers === 'string' ? JSON.parse(r.required_disclaimers) : r.required_disclaimers || [],
          logoRules: typeof r.logo_rules === 'string' ? JSON.parse(r.logo_rules) : r.logo_rules || [],
          brandColors: typeof r.brand_colors === 'string' ? JSON.parse(r.brand_colors) : r.brand_colors || [],
          accessibilityRequirements: typeof r.accessibility_requirements === 'string' ? JSON.parse(r.accessibility_requirements) : r.accessibility_requirements || [],
        }));
      } catch (e) {
        console.warn('[DB] Fallback to memory for getGuidelines');
      }
    }
    return memoryStore.guidelines;
  },

  async getGuidelinesByBrandId(brandId: string): Promise<BrandGuidelines | undefined> {
    const list = await this.getGuidelines();
    return list.find((g) => g.brandId === brandId);
  },

  async saveGuidelines(g: BrandGuidelines): Promise<BrandGuidelines> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        const [existing]: any = await pool.query('SELECT id FROM guidelines WHERE id = ?', [g.id]);
        if (existing.length > 0) {
          await pool.query(
            `UPDATE guidelines SET
              description = ?, approved_slogans = ?, voice_and_tone = ?, preferred_words = ?,
              prohibited_words = ?, approved_facts = ?, restricted_claims = ?, required_disclaimers = ?,
              logo_rules = ?, brand_colors = ?, accessibility_requirements = ?
             WHERE id = ?`,
            [
              g.description,
              JSON.stringify(g.approvedSlogans),
              JSON.stringify(g.voiceAndTone),
              JSON.stringify(g.preferredWords),
              JSON.stringify(g.prohibitedWords),
              JSON.stringify(g.approvedFacts),
              JSON.stringify(g.restrictedClaims),
              JSON.stringify(g.requiredDisclaimers),
              JSON.stringify(g.logoRules),
              JSON.stringify(g.brandColors),
              JSON.stringify(g.accessibilityRequirements),
              g.id,
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO guidelines (id, brand_id, description, approved_slogans, voice_and_tone, preferred_words, prohibited_words, approved_facts, restricted_claims, required_disclaimers, logo_rules, brand_colors, accessibility_requirements)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              g.id,
              g.brandId,
              g.description,
              JSON.stringify(g.approvedSlogans),
              JSON.stringify(g.voiceAndTone),
              JSON.stringify(g.preferredWords),
              JSON.stringify(g.prohibitedWords),
              JSON.stringify(g.approvedFacts),
              JSON.stringify(g.restrictedClaims),
              JSON.stringify(g.requiredDisclaimers),
              JSON.stringify(g.logoRules),
              JSON.stringify(g.brandColors),
              JSON.stringify(g.accessibilityRequirements),
            ]
          );
        }
      } catch (e) {
        console.warn('[DB] Fallback to memory for saveGuidelines');
      }
    }
    const idx = memoryStore.guidelines.findIndex((x) => x.id === g.id);
    if (idx >= 0) memoryStore.guidelines[idx] = g;
    else memoryStore.guidelines.push(g);
    return g;
  },

  // ---- AUDITS ----
  async getAudits(): Promise<Audit[]> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        const [auditRows]: any = await pool.query('SELECT * FROM audits ORDER BY created_at DESC');
        const [findingRows]: any = await pool.query('SELECT * FROM findings');
        const [revisionRows]: any = await pool.query('SELECT * FROM revisions ORDER BY created_at ASC');

        const findingsByAudit = new Map<string, Finding[]>();
        for (const f of findingRows) {
          const list = findingsByAudit.get(f.audit_id) || [];
          list.push({
            id: f.id,
            title: f.title,
            category: f.category,
            severity: f.severity,
            problematicText: f.problematic_text || undefined,
            explanation: f.explanation,
            brandRule: f.brand_rule,
            evidence: f.evidence || undefined,
            recommendation: f.recommendation,
            suggestedFix: f.suggested_fix || undefined,
            status: f.status,
            simulated: Boolean(f.simulated),
          });
          findingsByAudit.set(f.audit_id, list);
        }

        const revisionsByAudit = new Map<string, any[]>();
        for (const r of revisionRows) {
          const list = revisionsByAudit.get(r.audit_id) || [];
          list.push({
            id: r.id,
            content: r.content,
            note: r.note || '',
            source: r.source,
            createdAt: r.created_at,
          });
          revisionsByAudit.set(r.audit_id, list);
        }

        return auditRows.map((a: any) => ({
          id: a.id,
          title: a.title,
          campaign: a.campaign,
          contentType: a.content_type,
          content: a.content,
          revisedContent: a.revised_content,
          referenceUrl: a.reference_url || undefined,
          brandId: a.brand_id,
          brandName: a.brand_name,
          imageUrl: a.image_url || undefined,
          imageName: a.image_name || undefined,
          status: a.status,
          riskScore: a.risk_score,
          complianceStatus: a.compliance_status,
          summary: a.summary || '',
          findings: findingsByAudit.get(a.id) || [],
          revisions: revisionsByAudit.get(a.id) || [],
          submitter: a.submitter,
          reviewer: a.reviewer || undefined,
          reviewComment: a.review_comment || undefined,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          auditedAt: a.audited_at || undefined,
          reviewedAt: a.reviewed_at || undefined,
          simulated: Boolean(a.simulated),
        }));
      } catch (e) {
        console.warn('[DB] Fallback to memory for getAudits');
      }
    }
    return memoryStore.audits;
  },

  async getAuditById(id: string): Promise<Audit | undefined> {
    const list = await this.getAudits();
    return list.find((a) => a.id === id);
  },

  async saveAudit(audit: Audit): Promise<Audit> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        const [existing]: any = await pool.query('SELECT id FROM audits WHERE id = ?', [audit.id]);
        if (existing.length > 0) {
          await pool.query(
            `UPDATE audits SET
              title = ?, campaign = ?, content_type = ?, content = ?, revised_content = ?,
              reference_url = ?, brand_id = ?, brand_name = ?, image_url = ?, image_name = ?,
              status = ?, risk_score = ?, compliance_status = ?, summary = ?, submitter = ?,
              reviewer = ?, review_comment = ?, updated_at = ?, audited_at = ?, reviewed_at = ?,
              simulated = ?
             WHERE id = ?`,
            [
              audit.title,
              audit.campaign,
              audit.contentType,
              audit.content,
              audit.revisedContent,
              audit.referenceUrl || null,
              audit.brandId,
              audit.brandName,
              audit.imageUrl || null,
              audit.imageName || null,
              audit.status,
              audit.riskScore,
              audit.complianceStatus,
              audit.summary,
              audit.submitter,
              audit.reviewer || null,
              audit.reviewComment || null,
              audit.updatedAt,
              audit.auditedAt || null,
              audit.reviewedAt || null,
              audit.simulated ? 1 : 0,
              audit.id,
            ]
          );

          // Update findings: delete old and insert current
          await pool.query('DELETE FROM findings WHERE audit_id = ?', [audit.id]);
          for (const f of audit.findings) {
            await pool.query(
              `INSERT INTO findings (id, audit_id, title, category, severity, problematic_text, explanation, brand_rule, evidence, recommendation, suggested_fix, status, simulated)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                f.id,
                audit.id,
                f.title,
                f.category,
                f.severity,
                f.problematicText || null,
                f.explanation,
                f.brandRule,
                f.evidence || null,
                f.recommendation,
                f.suggestedFix || null,
                f.status,
                f.simulated ? 1 : 0,
              ]
            );
          }

          // Revisions: delete old and insert current
          await pool.query('DELETE FROM revisions WHERE audit_id = ?', [audit.id]);
          for (const r of audit.revisions) {
            await pool.query(
              `INSERT INTO revisions (id, audit_id, content, note, source, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [r.id, audit.id, r.content, r.note, r.source, r.createdAt]
            );
          }
        } else {
          await pool.query(
            `INSERT INTO audits (id, title, campaign, content_type, content, revised_content, reference_url, brand_id, brand_name, image_url, image_name, status, risk_score, compliance_status, summary, submitter, reviewer, review_comment, created_at, updated_at, audited_at, reviewed_at, simulated)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              audit.id,
              audit.title,
              audit.campaign,
              audit.contentType,
              audit.content,
              audit.revisedContent,
              audit.referenceUrl || null,
              audit.brandId,
              audit.brandName,
              audit.imageUrl || null,
              audit.imageName || null,
              audit.status,
              audit.riskScore,
              audit.complianceStatus,
              audit.summary,
              audit.submitter,
              audit.reviewer || null,
              audit.reviewComment || null,
              audit.createdAt,
              audit.updatedAt,
              audit.auditedAt || null,
              audit.reviewedAt || null,
              audit.simulated ? 1 : 0,
            ]
          );

          for (const f of audit.findings) {
            await pool.query(
              `INSERT INTO findings (id, audit_id, title, category, severity, problematic_text, explanation, brand_rule, evidence, recommendation, suggested_fix, status, simulated)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                f.id,
                audit.id,
                f.title,
                f.category,
                f.severity,
                f.problematicText || null,
                f.explanation,
                f.brandRule,
                f.evidence || null,
                f.recommendation,
                f.suggestedFix || null,
                f.status,
                f.simulated ? 1 : 0,
              ]
            );
          }

          for (const r of audit.revisions) {
            await pool.query(
              `INSERT INTO revisions (id, audit_id, content, note, source, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [r.id, audit.id, r.content, r.note, r.source, r.createdAt]
            );
          }
        }
      } catch (e) {
        console.warn('[DB] Fallback to memory for saveAudit');
      }
    }
    const idx = memoryStore.audits.findIndex((x) => x.id === audit.id);
    if (idx >= 0) memoryStore.audits[idx] = audit;
    else memoryStore.audits = [audit, ...memoryStore.audits];
    return audit;
  },

  // ---- APPROVAL EVENTS ----
  async getApprovalEvents(): Promise<ApprovalEvent[]> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        const [rows]: any = await pool.query('SELECT * FROM approval_events ORDER BY created_at DESC');
        return rows.map((r: any) => ({
          id: r.id,
          auditId: r.audit_id,
          action: r.action,
          reviewer: r.reviewer,
          comment: r.comment || '',
          createdAt: r.created_at,
        }));
      } catch (e) {
        console.warn('[DB] Fallback to memory for getApprovalEvents');
      }
    }
    return memoryStore.approvalEvents;
  },

  async addApprovalEvent(event: ApprovalEvent): Promise<ApprovalEvent> {
    if (isDbConnected()) {
      try {
        const pool = getPool()!;
        await pool.query(
          'INSERT INTO approval_events (id, audit_id, action, reviewer, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [event.id, event.auditId, event.action, event.reviewer, event.comment, event.createdAt]
        );
      } catch (e) {
        console.warn('[DB] Fallback to memory for addApprovalEvent');
      }
    }
    memoryStore.approvalEvents = [event, ...memoryStore.approvalEvents];
    return event;
  },

  // Reset to default seed
  async resetAll(): Promise<void> {
    memoryStore.brands = structuredClone(SEED_BRANDS);
    memoryStore.guidelines = structuredClone(SEED_GUIDELINES);
    memoryStore.audits = structuredClone(SEED_AUDITS);
    memoryStore.approvalEvents = structuredClone(SEED_APPROVAL_EVENTS);
  },
};
