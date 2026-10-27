import { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  FlaskConical,
  Eye,
  PencilLine,
} from 'lucide-react';
import {
  useStore,
  approveAudit,
  requestChanges,
  rejectAudit,
} from '@/lib/store';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import { RiskScore, SeverityBadge, StatusBadge, ComplianceBadge } from '@/components/Badges';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import type { PageId } from '@/components/Sidebar';
import type { Audit, ApprovalEvent } from '@/lib/types';

type ReviewAction = 'approve' | 'request-changes' | 'reject';

interface ReviewProps {
  onNavigate: (p: PageId, auditId?: string) => void;
}

export function ReviewApproval({ onNavigate }: ReviewProps) {
  const audits = useStore((s) => s.audits);
  const events = useStore((s) => s.approvalEvents);
  const settings = useStore((s) => s.settings);
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<ReviewAction | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  const queue = audits
    .filter((a) => {
      if (filter === 'pending') return a.status === 'Pending Approval';
      if (filter === 'reviewed') return a.status === 'Approved' || a.status === 'Rejected' || a.status === 'Changes Required';
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const selected = audits.find((a) => a.id === selectedId);

  const handleAction = (comment: string) => {
    if (!selectedId || !dialogAction) return;
    if (dialogAction === 'approve') {
      approveAudit(selectedId, comment);
      toast('success', 'Content approved.');
    } else if (dialogAction === 'request-changes') {
      requestChanges(selectedId, comment);
      toast('success', 'Changes requested. Submitter will be notified.');
    } else {
      rejectAudit(selectedId, comment);
      toast('success', 'Content rejected.');
    }
    setDialogAction(null);
  };

  const isReviewer = settings.currentRole === 'Reviewer' || settings.currentRole === 'Administrator';
  const pendingCount = audits.filter((a) => a.status === 'Pending Approval').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review & Approval"
        description={`${pendingCount} item${pendingCount === 1 ? '' : 's'} awaiting review · Role: ${settings.currentRole} (simulated)`}
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'reviewed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {f === 'all' ? 'All' : f === 'pending' ? `Pending (${pendingCount})` : 'Reviewed'}
          </button>
        ))}
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nothing to review"
          message="Submitted content awaiting approval will appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Queue list */}
          <div className="lg:col-span-2 space-y-2">
            {queue.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                  selectedId === a.id
                    ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-200 dark:ring-indigo-700'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.contentType} · {a.submitter}</p>
                  </div>
                  <RiskScore score={a.riskScore} size="sm" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            {selected ? (
              <ReviewDetail
                audit={selected}
                events={events.filter((e) => e.auditId === selected.id)}
                isReviewer={isReviewer}
                onNavigate={onNavigate}
                onAction={(a) => setDialogAction(a)}
              />
            ) : (
              <Card className="p-10">
                <div className="flex flex-col items-center justify-center text-center">
                  <Eye className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Select an item from the queue to review its details.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialogAction !== null}
        title={
          dialogAction === 'approve'
            ? 'Approve this content?'
            : dialogAction === 'request-changes'
            ? 'Request changes?'
            : 'Reject this content?'
        }
        message={
          dialogAction === 'approve'
            ? 'Approving publishes this content. Add an optional comment for the submitter.'
            : 'A comment is required so the submitter knows what to fix.'
        }
        confirmLabel={
          dialogAction === 'approve' ? 'Approve' : dialogAction === 'request-changes' ? 'Request Changes' : 'Reject'
        }
        cancelLabel="Cancel"
        destructive={dialogAction === 'reject'}
        requireText={dialogAction !== 'approve'}
        onConfirm={handleAction}
        onCancel={() => setDialogAction(null)}
      />
    </div>
  );
}

function ReviewDetail({
  audit,
  events,
  isReviewer,
  onNavigate,
  onAction,
}: {
  audit: Audit;
  events: ApprovalEvent[];
  isReviewer: boolean;
  onNavigate: (p: PageId, auditId?: string) => void;
  onAction: (a: ReviewAction) => void;
}) {
  const highCount = audit.findings.filter((f) => f.severity === 'High' && f.status === 'Open').length;
  const canReview = audit.status === 'Pending Approval' && isReviewer;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{audit.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{audit.campaign} · {audit.contentType}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={audit.status} />
            <ComplianceBadge status={audit.complianceStatus} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700/60">
            <RiskScore score={audit.riskScore} size="sm" />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Risk Score</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700/60">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{highCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">High-Risk Open</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700/60">
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{audit.findings.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total Findings</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => onNavigate('audit-results', audit.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
            <Eye className="h-4 w-4" /> Full Report
          </button>
          <button onClick={() => onNavigate('correction', audit.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
            <PencilLine className="h-4 w-4" /> Corrections
          </button>
        </div>
      </Card>

      {/* Findings summary */}
      <Card className="p-5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Findings ({audit.findings.length})</h4>
        {audit.findings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No issues detected.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {audit.findings.map((f) => (
              <div key={f.id} className="flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3">
                <SeverityBadge severity={f.severity} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{f.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">{f.category} · {f.explanation.slice(0, 80)}...</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Content comparison */}
      <Card className="p-5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Content Comparison</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Original</p>
            <p className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap line-clamp-6 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700">{audit.content}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Revised</p>
            <p className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/40 p-3 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap line-clamp-6 max-h-40 overflow-y-auto border border-indigo-200 dark:border-indigo-800/80">{audit.revisedContent}</p>
          </div>
        </div>
      </Card>

      {/* Review history */}
      {events.length > 0 && (
        <Card className="p-5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Review History</h4>
          <div className="mt-3 space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3">
                {e.action === 'approve' && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />}
                {e.action === 'request-changes' && <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />}
                {e.action === 'reject' && <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span className="capitalize">{e.action.replace('-', ' ')}</span> by {e.reviewer}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{new Date(e.createdAt).toLocaleString()}</p>
                  {e.comment && <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1"><MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />{e.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Review actions */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Review Decision</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {canReview ? 'Approve, request changes, or reject this content.' : audit.status === 'Pending Approval' ? 'Switch to Reviewer role (top right) to make a decision.' : `Current status: ${audit.status}`}
            </p>
          </div>
          {audit.simulated && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-1">
              <FlaskConical className="h-3 w-3" /> Simulated
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onAction('approve')}
            disabled={!canReview}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> Approve
          </button>
          <button
            onClick={() => onAction('request-changes')}
            disabled={!canReview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <AlertCircle className="h-4 w-4" /> Request Changes
          </button>
          <button
            onClick={() => onAction('reject')}
            disabled={!canReview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
        </div>
      </Card>
    </div>
  );
}
