import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Undo2,
  Wand2,
  Save,
  RefreshCw,
  Send,
  Check,
  History,
  PencilLine,
  AlertTriangle,
} from 'lucide-react';
import {
  useStore,
  updateRevisedContent,
  runAudit,
  submitForApproval,
  setFindingStatus,
} from '@/lib/store';
import { applySuggestion, applyAllSuggestions } from '@/lib/auditEngine';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import { RiskScore, SeverityBadge, StatusBadge } from '@/components/Badges';
import { useToast } from '@/components/Toast';
import type { PageId } from '@/components/Sidebar';
import type { Finding } from '@/lib/types';

interface CorrectionProps {
  auditId: string | null;
  onNavigate: (p: PageId, auditId?: string) => void;
}

export function CorrectionWorkspace({ auditId, onNavigate }: CorrectionProps) {
  const audit = useStore((s) => s.audits.find((a) => a.id === auditId));
  const { toast } = useToast();
  const [draft, setDraft] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (audit) setDraft(audit.revisedContent);
  }, [audit?.id, audit?.revisedContent]);

  if (!audit) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Audit not found"
        message="Select an audit from history to open the correction workspace."
        action={
          <button onClick={() => onNavigate('history')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Go to history
          </button>
        }
      />
    );
  }

  const dirty = draft !== audit.revisedContent;

  const handleApplyOne = (f: Finding) => {
    if (!f.suggestedFix || !f.problematicText) {
      toast('warning', 'This finding has no automatic fix available.');
      return;
    }
    const updated = applySuggestion(draft, f);
    setDraft(updated);
    setFindingStatus(audit.id, f.id, 'Resolved');
    toast('success', `Applied fix for "${f.title}".`);
  };

  const handleApplyAll = () => {
    const openFindings = audit.findings.filter((f) => f.status === 'Open');
    if (openFindings.length === 0) {
      toast('info', 'No open findings to apply.');
      return;
    }
    const updated = applyAllSuggestions(draft, openFindings);
    setDraft(updated);
    openFindings.forEach((f) => setFindingStatus(audit.id, f.id, 'Resolved'));
    toast('success', `Applied ${openFindings.length} suggestion${openFindings.length === 1 ? '' : 's'}.`);
  };

  const handleUndo = () => {
    setDraft(audit.revisedContent);
    toast('info', 'Reverted unsaved edits.');
  };

  const handleSaveDraft = () => {
    updateRevisedContent(audit.id, draft, 'Saved draft', 'edit');
    toast('success', 'Draft saved.');
  };

  const handleRerun = () => {
    updateRevisedContent(audit.id, draft, 'Re-ran audit', 'rerun');
    runAudit(audit.id);
    toast('success', 'Audit re-run on revised content. Score and findings updated.');
  };

  const handleSubmit = () => {
    updateRevisedContent(audit.id, draft, 'Submitted for approval', 'edit');
    submitForApproval(audit.id);
    toast('success', 'Revised content submitted for approval.');
    onNavigate('review');
  };

  // Diff highlight: mark problematic phrases in original
  const renderHighlighted = (text: string, findings: Finding[]) => {
    const segments: { text: string; hit?: Finding }[] = [{ text }];
    for (const f of findings) {
      if (!f.problematicText) continue;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.hit) continue;
        const lower = seg.text.toLowerCase();
        const idx = lower.indexOf(f.problematicText.toLowerCase());
        if (idx !== -1) {
          const before = seg.text.slice(0, idx);
          const match = seg.text.slice(idx, idx + f.problematicText.length);
          const after = seg.text.slice(idx + f.problematicText.length);
          segments.splice(i, 1, { text: before }, { text: match, hit: f }, { text: after });
          break;
        }
      }
    }
    return segments.map((seg, i) =>
      seg.hit ? (
        <mark
          key={i}
          className={`rounded px-1 py-0.5 transition-colors ${
            seg.hit.severity === 'High'
              ? 'bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800'
              : seg.hit.severity === 'Medium'
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
          }`}
          title={seg.hit.title}
        >
          {seg.text}
        </mark>
      ) : (
        <span key={i}>{seg.text}</span>
      )
    );
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate('audit-results', audit.id)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to results
      </button>

      <PageHeader
        title="Correction Workspace"
        description={audit.title}
        action={<StatusBadge status={audit.status} />}
      />

      {/* Score + actions bar */}
      <Card className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <RiskScore score={audit.riskScore} size="md" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{audit.findings.filter((f) => f.status === 'Open').length} open findings</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{audit.findings.filter((f) => f.status === 'Resolved').length} resolved</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleUndo} disabled={!dirty} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors">
            <Undo2 className="h-4 w-4" /> Undo
          </button>
          <button onClick={handleApplyAll} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors">
            <Wand2 className="h-4 w-4" /> Apply All
          </button>
          <button onClick={handleSaveDraft} disabled={!dirty} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors">
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button onClick={handleRerun} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
            <RefreshCw className="h-4 w-4" /> Re-run Audit
          </button>
          <button onClick={handleSubmit} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
            <Send className="h-4 w-4" /> Submit for Approval
          </button>
        </div>
      </Card>

      {/* Side-by-side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Original Content</h3>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Highlighted issues</span>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-700">
            {renderHighlighted(audit.content, audit.findings.filter((f) => f.status !== 'Ignored'))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Revised Content</h3>
            <div className="flex items-center gap-2">
              {dirty && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">● Unsaved</span>}
              <button onClick={() => setShowHistory((v) => !v)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1">
                <History className="h-3 w-3" /> History ({audit.revisions.length})
              </button>
            </div>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-slate-900 dark:text-slate-100 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60 focus:border-indigo-400 dark:focus:border-indigo-500 resize-y transition-colors"
          />
          {showHistory && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 bg-slate-50 dark:bg-slate-850">
              {audit.revisions.slice().reverse().map((r) => (
                <div key={r.id} className="p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{r.note}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Findings list with apply actions */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Findings & Suggestions</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Apply individual fixes or edit the revised content directly.</p>
        {audit.findings.length === 0 ? (
          <div className="mt-4 flex flex-col items-center py-6 text-center">
            <Check className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 font-medium">No findings — content is compliant.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {audit.findings.map((f) => (
              <div key={f.id} className={`rounded-xl border p-3.5 transition-colors ${f.status === 'Resolved' ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{f.title}</span>
                      <SeverityBadge severity={f.severity} />
                      {f.status === 'Resolved' && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check className="h-3 w-3" /> Resolved
                        </span>
                      )}
                    </div>
                    {f.problematicText && (
                      <p className="mt-1.5 text-xs font-mono text-red-900 dark:text-red-200 bg-red-50 dark:bg-red-950/50 rounded px-2.5 py-1 inline-block border border-red-200 dark:border-red-900/60">"{f.problematicText}"</p>
                    )}
                    {f.suggestedFix && (
                      <p className="mt-1.5 text-xs font-mono font-medium text-emerald-800 dark:text-emerald-300">→ "{f.suggestedFix}"</p>
                    )}
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{f.explanation}</p>
                  </div>
                  {f.status === 'Open' && f.suggestedFix && (
                    <button
                      onClick={() => handleApplyOne(f)}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors"
                    >
                      <Wand2 className="h-3 w-3" /> Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Compare */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <PencilLine className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Comparison
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
          <div>
            <p className="font-medium text-slate-500 dark:text-slate-400 mb-1">Original ({audit.content.length} chars)</p>
            <p className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-6 border border-slate-100 dark:border-slate-700/60">{audit.content}</p>
          </div>
          <div>
            <p className="font-medium text-slate-500 dark:text-slate-400 mb-1">Revised ({draft.length} chars)</p>
            <p className="rounded-lg bg-indigo-50/40 dark:bg-indigo-950/30 p-3 text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-6 border border-indigo-100/40 dark:border-indigo-900/40">{draft}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
