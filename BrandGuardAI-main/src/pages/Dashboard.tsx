import {
  FileSearch,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  BookMarked,
  ClipboardList,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { computeMetrics } from '@/lib/metrics';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import { RiskScore, SeverityBadge, StatusBadge } from '@/components/Badges';
import type { PageId } from '@/components/Sidebar';
import { useTheme } from '@/lib/theme';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

const PIE_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#64748b' };

interface DashboardProps {
  onNavigate: (p: PageId) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const audits = useStore((s) => s.audits);
  const { isDark } = useTheme();
  const m = computeMetrics(audits);

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    borderRadius: 12,
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: 12,
  };

  const recent = [...audits]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Brand compliance overview across all audited content."
        action={
          <button
            onClick={() => onNavigate('new-audit')}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileSearch className="h-4 w-4" />
            New Audit
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard icon={ClipboardList} label="Total Audits" value={m.total} accent="indigo" />
        <KpiCard icon={ShieldCheck} label="Compliance Rate" value={`${m.complianceRate}%`} accent="emerald" />
        <KpiCard icon={AlertTriangle} label="High-Risk Violations" value={m.highRisk} accent="red" />
        <KpiCard icon={Clock} label="Pending Approvals" value={m.pending} accent="amber" />
        <KpiCard icon={CheckCircle2} label="Approved Content" value={m.approved} accent="emerald" />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Compliance Trend Over Time</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Average compliance score by audit date</p>
          {m.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={m.trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#compGrad)"
                  name="Compliance %"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Violation Severity</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Distribution across all findings</p>
          {m.severityDist.some((s) => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={m.severityDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {m.severityDist.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
          <div className="mt-2 flex justify-center gap-4">
            {m.severityDist.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[s.name] }} />
                <span className="text-xs text-slate-600 dark:text-slate-400">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Category bar + shortcuts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Most Common Violation Categories</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Frequency by finding category</p>
          {m.categoryDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={m.categoryDist} layout="vertical" margin={{ left: 40, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: tickColor }}
                  width={130}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} name="Findings" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
          <div className="mt-3 space-y-2">
            <Shortcut
              icon={FileSearch}
              label="Create an audit"
              desc="Run a new content compliance check"
              onClick={() => onNavigate('new-audit')}
            />
            <Shortcut
              icon={BookMarked}
              label="View brand guidelines"
              desc="Review and edit NovaTech rules"
              onClick={() => onNavigate('guidelines')}
            />
            <Shortcut
              icon={Clock}
              label="Review pending content"
              desc={`${m.pending} item${m.pending === 1 ? '' : 's'} awaiting review`}
              onClick={() => onNavigate('review')}
            />
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Audit Activity</h3>
          <button
            onClick={() => onNavigate('history')}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {recent.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((a) => (
              <button
                key={a.id}
                onClick={() => onNavigate('history')}
                className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <RiskScore score={a.riskScore} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{a.title}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {a.contentType} · {a.campaign}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {a.findings.filter((f) => f.severity === 'High' && f.status === 'Open').length > 0 && (
                    <SeverityBadge severity="High" />
                  )}
                  <StatusBadge status={a.status} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No audits yet"
            message="Run your first content audit to see activity here."
            action={
              <button
                onClick={() => onNavigate('new-audit')}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <FileSearch className="h-4 w-4" /> Start an audit
              </button>
            }
          />
        )}
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof FileSearch;
  label: string;
  value: string | number;
  accent: 'indigo' | 'emerald' | 'red' | 'amber';
}) {
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

function Shortcut({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: typeof FileSearch;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-left hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
    </button>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center text-center">
      <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
      <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No data yet</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Run an audit to populate charts</p>
    </div>
  );
}
