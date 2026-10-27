import {
  LayoutDashboard,
  FileSearch,
  History,
  BookMarked,
  CheckSquare,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useStore } from '@/lib/store';

export type PageId =
  | 'dashboard'
  | 'new-audit'
  | 'history'
  | 'guidelines'
  | 'review'
  | 'analytics'
  | 'settings'
  | 'audit-results'
  | 'correction';

interface NavItem {
  id: PageId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new-audit', label: 'New Content Audit', icon: FileSearch },
  { id: 'history', label: 'Audit History', icon: History },
  { id: 'guidelines', label: 'Brand Guidelines', icon: BookMarked },
  { id: 'review', label: 'Review & Approval', icon: CheckSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ current, onNavigate, open, onClose }: SidebarProps) {
  const serverOnline = useStore((s) => s.serverOnline);
  const settings = useStore((s) => s.settings);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden">
            <img
              src="/assets/logo.png"
              alt="BrandGuard AI logo"
              className="h-9 w-9 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-600/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">BrandGuard</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">AI Compliance Platform</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = current === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-850 dark:to-slate-800 p-3.5 border border-indigo-100/40 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold">
                {serverOnline
                  ? settings.geminiConfigured
                    ? 'Gemini AI Active'
                    : 'Backend API Online'
                  : 'Offline Mode'}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
              {serverOnline
                ? settings.geminiConfigured
                  ? 'Real-time generative AI compliance auditing.'
                  : 'API connected. Add Gemini key to server/.env for live AI.'
                : 'Deterministic simulated audit engine active.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
