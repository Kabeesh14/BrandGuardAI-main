import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import {
  SEED_BRANDS,
  SEED_GUIDELINES,
  SEED_AUDITS,
  SEED_APPROVAL_EVENTS,
} from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  let connection: mysql.Connection | null = null;
  try {
    console.log(`[Migrate] Connecting to MySQL at ${env.MYSQL_HOST}:${env.MYSQL_PORT} as ${env.MYSQL_USER}...`);
    connection = await mysql.createConnection({
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      multipleStatements: true,
    });

    console.log(`[Migrate] Creating database ${env.MYSQL_DATABASE} if not exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${env.MYSQL_DATABASE}\`;`);

    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('[Migrate] Applying schema tables...');
    await connection.query(sql);

    // Check if brands are seeded
    const [brandRows]: any = await connection.query('SELECT COUNT(*) as cnt FROM brands');
    if (brandRows[0].cnt === 0) {
      console.log('[Migrate] Seeding initial brand data...');
      for (const b of SEED_BRANDS) {
        await connection.query(
          'INSERT INTO brands (id, name, description, created_at) VALUES (?, ?, ?, ?)',
          [b.id, b.name, b.description, b.createdAt]
        );
      }

      for (const g of SEED_GUIDELINES) {
        await connection.query(
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

      for (const a of SEED_AUDITS) {
        await connection.query(
          `INSERT INTO audits (id, title, campaign, content_type, content, revised_content, reference_url, brand_id, brand_name, image_url, image_name, status, risk_score, compliance_status, summary, submitter, reviewer, review_comment, created_at, updated_at, audited_at, reviewed_at, simulated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            a.id,
            a.title,
            a.campaign,
            a.contentType,
            a.content,
            a.revisedContent,
            a.referenceUrl || null,
            a.brandId,
            a.brandName,
            a.imageUrl || null,
            a.imageName || null,
            a.status,
            a.riskScore,
            a.complianceStatus,
            a.summary,
            a.submitter,
            a.reviewer || null,
            a.reviewComment || null,
            a.createdAt,
            a.updatedAt,
            a.auditedAt || null,
            a.reviewedAt || null,
            a.simulated ? 1 : 0,
          ]
        );

        for (const f of a.findings) {
          await connection.query(
            `INSERT INTO findings (id, audit_id, title, category, severity, problematic_text, explanation, brand_rule, evidence, recommendation, suggested_fix, status, simulated)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              f.id,
              a.id,
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

        for (const r of a.revisions) {
          await connection.query(
            `INSERT INTO revisions (id, audit_id, content, note, source, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [r.id, a.id, r.content, r.note, r.source, r.createdAt]
          );
        }
      }

      for (const ap of SEED_APPROVAL_EVENTS) {
        await connection.query(
          `INSERT INTO approval_events (id, audit_id, action, reviewer, comment, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ap.id, ap.auditId, ap.action, ap.reviewer, ap.comment, ap.createdAt]
        );
      }
      console.log('[Migrate] Seed data inserted successfully.');
    } else {
      console.log('[Migrate] Database already contains records. Skipping seed insertion.');
    }

    console.log('[Migrate] Database schema verified and ready.');
    return { success: true, message: 'Database schema and seed records ready.' };
  } catch (err: any) {
    console.warn('[Migrate] Migration failed:', err?.message || err);
    return { success: false, message: err?.message || 'Database connection error' };
  } finally {
    if (connection) await connection.end();
  }
}

// Auto-run when executed directly via CLI: tsx src/db/migrate.ts
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().then((res) => {
    if (!res.success) {
      console.log('\n[Tip] Make sure your MySQL credentials in .env are correct, or start the server in hybrid fallback mode.');
    }
  });
}
