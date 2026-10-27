import { useState, useMemo } from 'react';
import { History, Search, Filter, ChevronRight, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import { RiskScore, SeverityBadge, StatusBadge } from '@/components/Badges';
import type { PageId } from '@/components/Sidebar';
import type { AuditStatus, ContentType, Severity } from '@/lib/types';

interface HistoryProps {
  onNavigate: (p: PageId, auditId?: string) => void;
}

const statusOptions: (AuditStatus | 'All')[] = [
  'All', 'Draft', 'Audited', 'Changes Required', 'Pending Approval', 'Approved', 'Rejected',
];
const typeOptions: (ContentType | 'All')[] = [
  'All', 'Social Media', 'Advertisement', 'Website Copy', 'Email', 'Press Release',
];
const severityOptions: (Severity | 'All')[] = ['All', 'High', 'Medium', 'Low'];

export function AuditHistory({ onNavigate }: HistoryProps) {
  const audits = useStore((s) => s.audits);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'All'>('All');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return audits
      .filter((a) => {
        if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.campaign.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'All' && a.status !== statusFilter) return false;
        if (typeFilter !== 'All' && a.contentType !== typeFilter) return false;
        if (severityFilter !== 'All') {
          const hasSev = a.findings.some((f) => f.severity === severityFilter);
          if (!hasSev) return false;
        }
        const auditDate = a.createdAt.slice(0, 10);
        if (dateFrom && auditDate < dateFrom) return false;
        if (dateTo && auditDate > dateTo) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [audits, search, statusFilter, typeFilter, severityFilter, dateFrom, dateTo]);

  const activeFilterCount =
    (statusFilter !== 'All' ? 1 : 0) +
    (typeFilter !== 'All' ? 1 : 0) +
    (severityFilter !== 'All' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('All');
    setTypeFilter('All');
    setSeverityFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit History"
        description={`${filtered.length} of ${audits.length} audits`}
        action={
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
          >
            <Filter className="h-4 w-4" />
            Filters {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">{activeFilterCount}</span>}
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or campaign..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as AuditStatus | 'All')} options={statusOptions} />
            <FilterSelect label="Content Type" value={typeFilter} onChange={(v) => setTypeFilter(v as ContentType | 'All')} options={typeOptions} />
            <FilterSelect label="Severity" value={severityFilter} onChange={(v) => setSeverityFilter(v as Severity | 'All')} options={severityOptions} />
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60"
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
              <X className="h-3 w-3" /> Clear all filters
            </button>
          )}
        </Card>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audits found"
          message={activeFilterCount > 0 ? 'Try adjusting your filters or search.' : 'Run your first audit to see it here.'}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <table className="hidden md:table w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Findings</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => onNavigate('audit-results', a.id)}
                  className="cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.campaign}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{a.contentType}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><RiskScore score={a.riskScore} size="sm" /></td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">{a.findings.length}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{a.reviewer ?? '—'}</td>
                  <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => onNavigate('audit-results', a.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <RiskScore score={a.riskScore} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{a.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.contentType} · {new Date(a.createdAt).toLocaleDateString()}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    {a.findings.some((f) => f.severity === 'High' && f.status === 'Open') && <SeverityBadge severity="High" />}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60 transition-colors"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{o}</option>
        ))}
      </select>
    </div>
  );
}
