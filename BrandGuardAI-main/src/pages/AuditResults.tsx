import {
  ArrowLeft,
  PencilLine,
  Send,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  FlaskConical,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore, runAudit, submitForApproval } from '@/lib/store';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import { RiskScore, SeverityBadge, StatusBadge, ComplianceBadge } from '@/components/Badges';
import { useToast } from '@/components/Toast';
import type { Finding } from '@/lib/types';
import type { PageId } from '@/components/Sidebar';

interface AuditResultsProps {
  auditId: string | null;
  onNavigate: (p: PageId, auditId?: string) => void;
}

export function AuditResults({ auditId, onNavigate }: AuditResultsProps) {
  const audit = useStore((s) => s.audits.find((a) => a.id === auditId));
  const { toast } = useToast();

  if (!audit) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Audit not found"
        message="The audit you're looking for doesn't exist or was removed."
        action={
          <button
            onClick={() => onNavigate('history')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to history
          </button>
        }
      />
    );
  }

  const highCount = audit.findings.filter((f) => f.severity === 'High').length;
  const medCount = audit.findings.filter((f) => f.severity === 'Medium').length;
  const lowCount = audit.findings.filter((f) => f.severity === 'Low').length;

  const handleRerun = () => {
    runAudit(audit.id);
    toast('success', 'Audit re-run. Findings and score updated.');
  };

  const handleSubmit = () => {
    submitForApproval(audit.id);
    toast('success', 'Content submitted for approval.');
    onNavigate('review');
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate('history')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to history
      </button>

      <PageHeader
        title={audit.title}
        description={`${audit.contentType} · ${audit.campaign} · ${audit.brandName}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={audit.status} />
          </div>
        }
      />

      {/* Score overview */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-5 flex items-center gap-4">
          <RiskScore score={audit.riskScore} size="lg" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Risk Score</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{audit.riskScore}/100</p>
            <div className="mt-1"><ComplianceBadge status={audit.complianceStatus} /></div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">High Severity</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{highCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Medium / Low</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{medCount + lowCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Findings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{audit.findings.length}</p>
        </Card>
      </div>

      {/* Summary */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Audit Summary</h3>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{audit.summary}</p>
            {audit.simulated && (
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-1">
                <FlaskConical className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" /> Simulated results — Demo Mode
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Content preview */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Submitted Content</h3>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans border border-slate-200 dark:border-slate-700">
{audit.revisedContent}
        </pre>
        {audit.imageUrl && (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <ImageIcon className="h-3.5 w-3.5" /> {audit.imageName}
            </div>
            <img src={audit.imageUrl} alt="Submitted" className="rounded-xl border border-slate-200 dark:border-slate-700 max-h-72 object-contain bg-slate-50 dark:bg-slate-800" />
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Image preview attached. Visual identity analysis runs alongside generative copy evaluation.
            </p>
          </div>
        )}
      </Card>

      {/* Findings */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Findings ({audit.findings.length})</h3>
        {audit.findings.length === 0 ? (
          <div className="mt-4 flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No issues detected</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">This content complies with current brand guidelines.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {audit.findings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Next Steps</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Fix issues in the correction workspace, re-run the audit, or submit for approval.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('correction', audit.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
            >
              <PencilLine className="h-4 w-4" /> Open Correction Workspace
            </button>
            <button
              onClick={handleRerun}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
            >
              <RefreshCw className="h-4 w-4" /> Re-run Audit
            </button>
            <button
              onClick={handleSubmit}
              disabled={audit.status === 'Pending Approval' || audit.status === 'Approved'}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" /> Submit for Approval
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const icon =
    finding.severity === 'High'
      ? AlertTriangle
      : finding.severity === 'Medium'
      ? Info
      : Lightbulb;
  const iconColor =
    finding.severity === 'High'
      ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/60'
      : finding.severity === 'Medium'
      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/60'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/60';
  const Icon = icon;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{finding.title}</h4>
            <SeverityBadge severity={finding.severity} />
            <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{finding.category}</span>
          </div>

          {finding.problematicText && (
            <div className="mt-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/70 px-3 py-2 text-sm font-mono text-red-900 dark:text-red-200">
              <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 block mb-0.5">Problematic phrase</span>
              "{finding.problematicText}"
            </div>
          )}

          <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{finding.explanation}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Brand Rule
              </p>
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{finding.brandRule}</p>
            </div>
            <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                <Lightbulb className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> Recommended Fix
              </p>
              <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                {finding.recommendation}
                {finding.suggestedFix && (
                  <span className="block mt-1.5 font-mono text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    → "{finding.suggestedFix}"
                  </span>
                )}
              </p>
            </div>
          </div>

          {finding.evidence && (
            <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Evidence:</span> {finding.evidence}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
