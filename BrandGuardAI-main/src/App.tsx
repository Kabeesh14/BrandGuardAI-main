import { useState } from 'react';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ToastProvider } from '@/components/Toast';
import { Dashboard } from '@/pages/Dashboard';
import { NewAudit } from '@/pages/NewAudit';
import { AuditResults } from '@/pages/AuditResults';
import { CorrectionWorkspace } from '@/pages/CorrectionWorkspace';
import { BrandGuidelines } from '@/pages/BrandGuidelines';
import { ReviewApproval } from '@/pages/ReviewApproval';
import { AuditHistory } from '@/pages/AuditHistory';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';

const pageTitles: Record<PageId, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Brand compliance overview' },
  'new-audit': { title: 'New Content Audit', subtitle: 'Submit content for analysis' },
  'audit-results': { title: 'Audit Results', subtitle: 'Detailed findings report' },
  correction: { title: 'Correction Workspace', subtitle: 'Fix and re-run content' },
  history: { title: 'Audit History', subtitle: 'All past audits' },
  guidelines: { title: 'Brand Guidelines', subtitle: 'Manage compliance rules' },
  review: { title: 'Review & Approval', subtitle: 'Approve or reject content' },
  analytics: { title: 'Analytics', subtitle: 'Compliance insights' },
  settings: { title: 'Settings', subtitle: 'Configuration and integrations' },
};

import { ThemeProvider } from '@/lib/theme';

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (p: PageId, auditId?: string) => {
    if (auditId) setSelectedAuditId(auditId);
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const meta = pageTitles[page];

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'new-audit':
        return <NewAudit onNavigate={navigate} />;
      case 'audit-results':
        return <AuditResults auditId={selectedAuditId} onNavigate={navigate} />;
      case 'correction':
        return <CorrectionWorkspace auditId={selectedAuditId} onNavigate={navigate} />;
      case 'history':
        return <AuditHistory onNavigate={navigate} />;
      case 'guidelines':
        return <BrandGuidelines />;
      case 'review':
        return <ReviewApproval onNavigate={navigate} />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
          <Sidebar
            current={page}
            onNavigate={navigate}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="lg:pl-64">
            <TopBar
              title={meta.title}
              subtitle={meta.subtitle}
              onMenuClick={() => setSidebarOpen(true)}
            />
            <main className="p-4 lg:p-6 max-w-7xl mx-auto">{renderPage()}</main>
          </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
