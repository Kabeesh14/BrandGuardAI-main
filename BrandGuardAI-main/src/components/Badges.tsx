import type { AuditStatus, Severity } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSearch,
  XCircle,
  PencilLine,
} from 'lucide-react';

const statusConfig: Record<AuditStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  Draft: { label: 'Draft', className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: PencilLine },
  Audited: { label: 'Audited', className: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: FileSearch },
  'Changes Required': { label: 'Changes Required', className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: AlertCircle },
  'Pending Approval': { label: 'Pending Approval', className: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: Clock },
  Approved: { label: 'Approved', className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', className: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', icon: XCircle },
};

export function StatusBadge({ status }: { status: AuditStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

const severityConfig: Record<Severity, string> = {
  High: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  Medium: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Low: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${severityConfig[severity]}`}>
      {severity}
    </span>
  );
}

export function RiskScore({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color =
    score <= 20
      ? 'text-emerald-600 dark:text-emerald-400'
      : score <= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';
  const ring =
    score <= 20
      ? 'ring-emerald-200 dark:ring-emerald-900/60'
      : score <= 50
      ? 'ring-amber-200 dark:ring-amber-900/60'
      : 'ring-red-200 dark:ring-red-900/60';
  const sizeClass =
    size === 'lg' ? 'h-20 w-20 text-3xl' : size === 'sm' ? 'h-10 w-10 text-base' : 'h-14 w-14 text-xl';
  return (
    <div className={`flex items-center justify-center rounded-full bg-white dark:bg-slate-900 font-bold ${color} ring-2 ${ring} ${sizeClass} transition-colors`}>
      {score}
    </div>
  );
}

export function ComplianceBadge({ status }: { status: 'Compliant' | 'Mostly Compliant' | 'Non-Compliant' }) {
  const cls =
    status === 'Compliant'
      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      : status === 'Mostly Compliant'
      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
