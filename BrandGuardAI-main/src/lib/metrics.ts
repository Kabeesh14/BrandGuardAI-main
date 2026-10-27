import type { Audit, Severity } from './types';

export function computeMetrics(audits: Audit[]) {
  const total = audits.length;
  const approved = audits.filter((a) => a.status === 'Approved').length;
  const pending = audits.filter((a) => a.status === 'Pending Approval').length;
  const changesRequired = audits.filter((a) => a.status === 'Changes Required').length;
  const rejected = audits.filter((a) => a.status === 'Rejected').length;

  const allFindings = audits.flatMap((a) => a.findings);
  const highRisk = allFindings.filter((f) => f.severity === 'High' && f.status === 'Open').length;

  const audited = audits.filter((a) => a.auditedAt);
  const avgRisk =
    audited.length > 0
      ? Math.round(audited.reduce((s, a) => s + a.riskScore, 0) / audited.length)
      : 0;
  const complianceRate =
    audited.length > 0
      ? Math.round(
          (audited.filter((a) => a.riskScore <= 20).length / audited.length) * 100
        )
      : 0;

  // Severity distribution
  const severityDist: { name: Severity; value: number }[] = [
    { name: 'High', value: allFindings.filter((f) => f.severity === 'High').length },
    { name: 'Medium', value: allFindings.filter((f) => f.severity === 'Medium').length },
    { name: 'Low', value: allFindings.filter((f) => f.severity === 'Low').length },
  ];

  // Category distribution
  const categoryMap = new Map<string, number>();
  for (const f of allFindings) {
    categoryMap.set(f.category, (categoryMap.get(f.category) ?? 0) + 1);
  }
  const categoryDist = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Content type volume
  const typeMap = new Map<string, number>();
  for (const a of audits) {
    typeMap.set(a.contentType, (typeMap.get(a.contentType) ?? 0) + 1);
  }
  const typeVolume = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

  // Compliance trend over time (by date)
  const trendMap = new Map<string, { date: string; score: number; count: number }>();
  for (const a of audited) {
    const date = (a.auditedAt ?? a.createdAt).slice(0, 10);
    const existing = trendMap.get(date);
    if (existing) {
      existing.score += a.riskScore;
      existing.count += 1;
    } else {
      trendMap.set(date, { date, score: a.riskScore, count: 1 });
    }
  }
  const trend = Array.from(trendMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => ({
      date: t.date,
      avgRisk: Math.round(t.score / t.count),
      compliance: Math.round((1 - t.score / t.count / 100) * 100),
    }));

  // Approval / rejection rates
  const reviewed = approved + rejected;
  const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;
  const rejectionRate = reviewed > 0 ? Math.round((rejected / reviewed) * 100) : 0;

  // Avg revisions before approval
  const approvedAudits = audits.filter((a) => a.status === 'Approved');
  const avgRevisions =
    approvedAudits.length > 0
      ? (
          approvedAudits.reduce((s, a) => s + a.revisions.length, 0) /
          approvedAudits.length
        ).toFixed(1)
      : '0';

  // Most violated rules
  const ruleMap = new Map<string, number>();
  for (const f of allFindings) {
    const key = f.brandRule.slice(0, 50);
    ruleMap.set(key, (ruleMap.get(key) ?? 0) + 1);
  }
  const topRules = Array.from(ruleMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    total,
    approved,
    pending,
    changesRequired,
    rejected,
    highRisk,
    avgRisk,
    complianceRate,
    severityDist,
    categoryDist,
    typeVolume,
    trend,
    approvalRate,
    rejectionRate,
    avgRevisions,
    topRules,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;
