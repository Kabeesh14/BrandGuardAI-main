import { useState, useRef } from 'react';
import {
  FileSearch,
  Sparkles,
  Upload,
  X,
  Link2,
} from 'lucide-react';
import { useStore, createAudit, runAuditAsync } from '@/lib/store';
import { SEED_SAMPLE_CONTENT } from '@/lib/seed';
import { Card, PageHeader } from '@/components/ui';
import { useToast } from '@/components/Toast';
import type { ContentType } from '@/lib/types';
import type { PageId as NavPageId } from '@/components/Sidebar';

const contentTypes: ContentType[] = [
  'Social Media',
  'Advertisement',
  'Website Copy',
  'Email',
  'Press Release',
];

interface NewAuditProps {
  onNavigate: (p: NavPageId, auditId?: string) => void;
}

export function NewAudit({ onNavigate }: NewAuditProps) {
  const brands = useStore((s) => s.brands);
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [campaign, setCampaign] = useState('');
  const [contentType, setContentType] = useState<ContentType>('Advertisement');
  const [content, setContent] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [brandId, setBrandId] = useState(brands[0]?.id ?? '');
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [imageName, setImageName] = useState<string | undefined>();
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSample = () => {
    setTitle(SEED_SAMPLE_CONTENT.title);
    setCampaign(SEED_SAMPLE_CONTENT.campaign);
    setContentType(SEED_SAMPLE_CONTENT.contentType);
    setContent(SEED_SAMPLE_CONTENT.content);
    setReferenceUrl(SEED_SAMPLE_CONTENT.referenceUrl);
    setBrandId(SEED_SAMPLE_CONTENT.brandId);
    setErrors({});
    toast('info', 'Sample NovaTech advertisement loaded. It intentionally contains several brand violations.');
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Content title is required.';
    if (!campaign.trim()) e.campaign = 'Campaign name is required.';
    if (!content.trim()) e.content = 'Content body cannot be empty.';
    if (content.trim().length < 10) e.content = 'Content is too short to audit meaningfully.';
    if (!brandId) e.brand = 'Select a brand.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast('error', 'Image must be under 5MB.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast('error', 'Only PNG, JPEG, and WebP images are allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  const removeImage = () => {
    setImagePreview(undefined);
    setImageName(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRun = async () => {
    if (!validate()) {
      toast('error', 'Please fix the highlighted fields before running the audit.');
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const audit = createAudit({
        title: title.trim(),
        campaign: campaign.trim(),
        contentType,
        content: content.trim(),
        referenceUrl: referenceUrl.trim() || undefined,
        brandId,
        imageUrl: imagePreview,
        imageName,
      });
      await runAuditAsync(audit.id);
      setProcessing(false);
      toast('success', 'Audit complete. Review the findings below.');
      onNavigate('audit-results', audit.id);
    } catch {
      setProcessing(false);
      toast('error', 'Something went wrong while running the audit. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Content Audit"
        description="Submit content for AI-powered brand compliance analysis."
        action={
          <button
            onClick={loadSample}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Load Sample Content
          </button>
        }
      />

      {processing ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-indigo-600" />
              <FileSearch className="absolute inset-0 m-auto h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Analyzing content...</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Checking brand guidelines, approved facts, and tone consistency.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Content Title" error={errors.title} required>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls(errors.title)}
                    placeholder="e.g. NovaTech Q4 Launch Promo"
                  />
                </Field>
                <Field label="Campaign Name" error={errors.campaign} required>
                  <input
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    className={inputCls(errors.campaign)}
                    placeholder="e.g. Q4 Acquisition Campaign"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Content Type" required>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className={inputCls()}
                  >
                    {contentTypes.map((t) => (
                      <option key={t} value={t} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Brand" error={errors.brand} required>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className={inputCls(errors.brand)}
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{b.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Content" error={errors.content} required
                hint="Paste the full text to be audited.">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={9}
                  className={inputCls(errors.content) + ' font-mono text-sm leading-relaxed'}
                  placeholder="Enter the marketing content to audit..."
                />
              </Field>

              <Field label="Reference URL / Supporting Evidence"
                hint="Optional — link to source material backing any claims.">
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    className={inputCls() + ' pl-9'}
                    placeholder="https://..."
                  />
                </div>
              </Field>
            </Card>

            {/* Image upload */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Image Upload (Optional)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                PNG, JPEG, or WebP up to 5MB. Attached images are inspected alongside copy.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onFileChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="mt-3 relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <img src={imagePreview} alt="Upload preview" className="w-full max-h-64 object-contain bg-slate-50 dark:bg-slate-850" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 rounded-lg bg-white/90 dark:bg-slate-800/90 p-1.5 text-slate-600 dark:text-slate-300 shadow hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850">{imageName}</p>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-8 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Click to upload an image</span>
                </button>
              )}
            </Card>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <Card className="p-5 sticky top-20">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Audit Summary</h3>
              <dl className="mt-3 space-y-2.5 text-sm">
                <Row label="Brand" value={brands.find((b) => b.id === brandId)?.name ?? '—'} />
                <Row label="Type" value={contentType} />
                <Row label="Characters" value={content.length.toString()} />
                <Row label="Image" value={imageName ?? 'None'} />
              </dl>
              <button
                onClick={handleRun}
                disabled={processing}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <FileSearch className="h-4 w-4" />
                Run Audit
              </button>
              <p className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500 text-center">
                Analyzes prohibited words, claims, disclaimers, and guidelines.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function inputCls(error?: string): string {
  return `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none transition-colors ${
    error
      ? 'border-red-300 dark:border-red-800 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-950'
      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 focus:border-indigo-400 dark:focus:border-indigo-500'
  }`;
}

function Field({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-slate-900 dark:text-slate-100 font-medium text-right truncate">{value}</dd>
    </div>
  );
}
