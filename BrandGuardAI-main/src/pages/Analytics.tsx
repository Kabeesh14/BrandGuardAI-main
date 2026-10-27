import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { computeMetrics } from '@/lib/metrics';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

const PIE_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#64748b' };

type RangeKey = '7d' | '30d' | '90d' | 'all';

export function Analytics() {
  const audits = useStore((s) => s.audits);
  const { isDark } = useTheme();
  const [range, setRange] = useState<RangeKey>('all');

  const filteredAudits = useMemo(() => {
    if (range === 'all') return audits;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return audits.filter((a) => a.createdAt >= cutoff);
  }, [audits, range]);

  const m = computeMetrics(filteredAudits);

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    borderRadius: 12,
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Compliance insights derived from stored audit records."
        action={
          <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm">
            {(['7d', '30d', '90d', 'all'] as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {r === 'all' ? 'All time' : `Last ${r}`}
              </button>
            ))}
          </div>
        }
      />

      {filteredAudits.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data for this range"
          message="Run audits within the selected period to populate analytics."
        />
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={ShieldCheck} label="Compliance Rate" value={`${m.complianceRate}%`} accent="emerald" />
            <KpiCard icon={CheckCircle2} label="Approval Rate" value={`${m.approvalRate}%`} accent="indigo" />
            <KpiCard icon={XCircle} label="Rejection Rate" value={`${m.rejectionRate}%`} accent="red" />
            <KpiCard icon={GitBranch} label="Avg Revisions to Approve" value={m.avgRevisions} accent="amber" />
          </div>

          {/* Compliance over time */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Compliance Rate Over Time</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Daily average compliance score across audited content</p>
            {m.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={m.trend} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="compGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickColor }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={2} fill="url(#compGrad2)" name="Compliance %" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Violations by category */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Violations by Category</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Frequency of each finding category</p>
              {m.categoryDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={m.categoryDist} layout="vertical" margin={{ left: 40, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: tickColor }} width={130} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} name="Findings" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </Card>

            {/* Severity distribution */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Severity Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">High, medium, and low findings</p>
              {m.severityDist.some((s) => s.value > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={m.severityDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {m.severityDist.map((e) => <Cell key={e.name} fill={PIE_COLORS[e.name]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend formatter={(value) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Most violated rules */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Most Frequently Violated Brand Rules</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Top 5 rules breached across audits</p>
              {m.topRules.length > 0 ? (
                <div className="space-y-2.5">
                  {m.topRules.map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{i + 1}</span>
                      <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{r.name}</p>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">{r.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyChart />
              )}
            </Card>

            {/* Audit volume by content type */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Audit Volume by Content Type</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Distribution of audited content</p>
              {m.typeVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={m.typeVolume} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Audits" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: typeof BarChart3; label: string; value: string; accent: 'indigo' | 'emerald' | 'red' | 'amber' }) {
  const accents = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
  };
  return (
    <Card className="p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accents[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center text-center">
      <TrendingUp className="h-10 w-10 text-slate-300 dark:text-slate-600" />
      <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No data available</p>
    </div>
  );
}
