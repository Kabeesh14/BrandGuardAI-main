import type { ReactNode } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
  destructive?: boolean;
  requireText?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  requireText = false,
}: ConfirmDialogProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    if (requireText && !text.trim()) {
      setError(true);
      return;
    }
    const comment = text.trim();
    setText('');
    setError(false);
    onConfirm(comment);
  };

  const handleCancel = () => {
    setText('');
    setError(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-colors">
        <div className="flex items-start gap-3">
          {destructive && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/60">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</div>
          </div>
          <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {requireText && (
          <div className="mt-4">
            <textarea
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:ring-2 ${
                error
                  ? 'border-red-300 dark:border-red-800 focus:ring-red-200 dark:focus:ring-red-950'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-200 dark:focus:ring-indigo-900/60 focus:border-indigo-400'
              }`}
              rows={3}
              placeholder="Add a comment (required)..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(false);
              }}
            />
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">A comment is required for this action.</p>}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
