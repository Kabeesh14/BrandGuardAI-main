import {
  Database,
  Sparkles,
  RotateCcw,
  UserCircle,
  ShieldAlert,
  Info,
  Server,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { useStore, setRole, resetDemoData, syncFromBackend } from '@/lib/store';
import { Card, PageHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useState, useEffect } from 'react';
import type { DemoRole } from '@/lib/types';

const roles: DemoRole[] = ['Content Creator', 'Reviewer', 'Administrator'];
const roleDescriptions: Record<DemoRole, string> = {
  'Content Creator': 'Can submit content for auditing and corrections.',
  Reviewer: 'Can approve, request changes, or reject submitted content.',
  Administrator: 'Can manage brands, guidelines, and all content.',
};

export function Settings() {
  const settings = useStore((s) => s.settings);
  const health = useStore((s) => s.health);
  const serverOnline = useStore((s) => s.serverOnline);
  const auditCount = useStore((s) => s.audits.length);
  const brandCount = useStore((s) => s.brands.length);
  const { toast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    syncFromBackend();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const ok = await syncFromBackend();
    setRefreshing(false);
    if (ok) {
      toast('success', 'Backend connectivity status refreshed.');
    } else {
      toast('warning', 'Could not reach backend server on port 3001.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure backend integrations, role simulation, and system status."
        action={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        }
      />

      {/* Role simulation */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Role Simulation</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Demo only — switch roles to test different review and admin permissions.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                toast('info', `Switched to ${r} role.`);
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                settings.currentRole === r
                  ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-200 dark:ring-indigo-700'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{roleDescriptions[r]}</p>
              {settings.currentRole === r && (
                <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">● Active</p>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Live Integration status */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Full-Stack Integration Status</h3>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${serverOnline ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
            <span className={`h-2 w-2 rounded-full ${serverOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {serverOnline ? 'API Connected' : 'Offline Mode'}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <IntegrationRow
            icon={Server}
            name="Express REST Backend"
            description={serverOnline ? `Online on port ${health?.services.server.port || 3001} · Serving /api endpoints` : 'Backend offline · Using client-side store fallback'}
            enabled={serverOnline}
            badgeText={serverOnline ? 'Port 3001' : 'Offline'}
          />
          <IntegrationRow
            icon={Sparkles}
            name="Google Gemini AI"
            description={
              settings.geminiConfigured
                ? `Active (${health?.services.gemini.model || 'gemini-3.5-flash-lite'}) · Live generative compliance checks`
                : 'Key pending in server/.env · Audits run via deterministic engine fallback'
            }
            enabled={settings.geminiConfigured}
            badgeText={settings.geminiConfigured ? 'Active AI' : 'Deterministic'}
          />
          <IntegrationRow
            icon={Database}
            name="MySQL Database"
            description={
              settings.mysqlConfigured
                ? `Connected to MySQL 8.0 (${health?.services.mysql.database})`
                : 'Credentials pending in server/.env · Operating via in-memory/localStorage adapter'
            }
            enabled={settings.mysqlConfigured}
            badgeText={settings.mysqlConfigured ? 'MySQL Live' : 'In-Memory / Local'}
          />
        </div>
      </Card>

      {/* Configuration Guide */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Environment Configuration</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Credentials are kept secure on the backend server. To enable live Gemini AI and MySQL persistence, edit <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">server/.env</code>:
        </p>
        <div className="mt-3 rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto border border-slate-800 dark:border-slate-800">
          <p className="text-slate-500"># server/.env</p>
          <p><span className="text-indigo-400">PORT</span>=3001</p>
          <p><span className="text-indigo-400">GEMINI_API_KEY</span>=your_google_gemini_api_key_here</p>
          <p><span className="text-indigo-400">GEMINI_MODEL</span>=gemini-3.5-flash-lite</p>
          <p><span className="text-indigo-400">MYSQL_HOST</span>=localhost</p>
          <p><span className="text-indigo-400">MYSQL_USER</span>=root</p>
          <p><span className="text-indigo-400">MYSQL_PASSWORD</span>=your_mysql_password_here</p>
          <p><span className="text-indigo-400">MYSQL_DATABASE</span>=brandguard_db</p>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Run <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 font-mono text-slate-700 dark:text-slate-300">npm run migrate</code> inside the <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 font-mono text-slate-700 dark:text-slate-300">server/</code> directory to initialize MySQL tables once credentials are set.
        </p>
      </Card>

      {/* Data management */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Data Management</h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Audits in Store" value={auditCount} />
          <Stat label="Brands in Store" value={brandCount} />
          <Stat label="Sync Mode" value={serverOnline ? (settings.mysqlConfigured ? 'MySQL DB' : 'Backend Memory') : 'localStorage'} />
        </div>
        <button
          onClick={() => setResetOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800/80 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shadow-sm"
        >
          <RotateCcw className="h-4 w-4" /> Reset Demo Data
        </button>
      </Card>

      {/* About */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">About BrandGuard AI</h3>
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            BrandGuard AI is an enterprise AI-powered brand compliance platform that detects content mistakes, unauthorized claims, and guideline violations before publication.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Equipped with a real <span className="font-medium text-slate-700 dark:text-slate-200">Node.js Express backend</span>, <span className="font-medium text-slate-700 dark:text-slate-200">MySQL schema</span>, and <span className="font-medium text-slate-700 dark:text-slate-200">Google Gemini AI integration</span> with transparent fallback support.
          </p>
        </div>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        title="Reset all demo data?"
        message="This restores the original NovaTech seed data across both server and local storage, discarding all newly created audits."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          resetDemoData();
          setResetOpen(false);
          toast('success', 'Demo data has been reset to initial state.');
        }}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}

function IntegrationRow({
  icon: Icon,
  name,
  description,
  enabled,
  badgeText,
}: {
  icon: typeof Database;
  name: string;
  description: string;
  enabled: boolean;
  badgeText?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3.5">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${enabled ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${enabled ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            {badgeText || (enabled ? 'Active' : 'Inactive')}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3.5 text-center border border-slate-100 dark:border-slate-700/60">
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
