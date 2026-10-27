import { Menu, Bell, ChevronDown, FlaskConical, Sparkles, Server, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import type { DemoRole } from '@/lib/types';
import { useStore, setRole, resetDemoData } from '@/lib/store';
import { useToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { useTheme } from '@/lib/theme';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

const roles: DemoRole[] = ['Content Creator', 'Reviewer', 'Administrator'];

export function TopBar({ title, subtitle, onMenuClick }: TopBarProps) {
  const settings = useStore((s) => s.settings);
  const serverOnline = useStore((s) => s.serverOnline);
  const { toast } = useToast();
  const { theme, toggleTheme, isDark } = useTheme();
  const [roleOpen, setRoleOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 backdrop-blur lg:px-6 transition-colors">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {settings.geminiConfigured ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Gemini AI Active
          </span>
        ) : serverOnline ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Server className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            API Connected
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <FlaskConical className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            Demo Mode
          </span>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="relative rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50">
              <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto py-2">
                <NotifRow text="Summer Social Carousel is awaiting your review." />
                <NotifRow text="Customer Newsletter requires changes before approval." />
                <NotifRow text="Press Release — Q3 Results was approved." />
              </div>
            </div>
          )}
        </div>

        {/* Role selector */}
        <div className="relative">
          <button
            onClick={() => setRoleOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {settings.currentUser.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">{settings.currentUser}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{settings.currentRole}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {roleOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50">
              <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Role Simulation</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Demo only — no real auth</p>
              </div>
              <div className="py-1.5">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setRoleOpen(false);
                      toast('info', `Switched to ${r} (role simulation).`);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      settings.currentRole === r
                        ? 'text-indigo-700 dark:text-indigo-400 font-medium'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r}
                    {settings.currentRole === r && <span className="text-indigo-600 dark:text-indigo-400">●</span>}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 p-2">
                <button
                  onClick={() => {
                    setRoleOpen(false);
                    setResetOpen(true);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Reset demo data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset demo data?"
        message="This restores all seeded NovaTech audits, guidelines, and approvals, discarding changes made during this session."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          resetDemoData();
          setResetOpen(false);
          toast('success', 'Demo data has been reset.');
        }}
        onCancel={() => setResetOpen(false)}
      />
    </header>
  );
}

function NotifRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{text}</p>
    </div>
  );
}
