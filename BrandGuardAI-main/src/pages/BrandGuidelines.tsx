import { useState } from 'react';
import {
  BookMarked,
  Plus,
  Trash2,
  Save,
  X,
  Megaphone,
  Palette,
  Shield,
  FileText,
  Type,
  Eye,
  Accessibility,
  Hash,
} from 'lucide-react';
import { useStore, saveGuidelines, addBrand, deleteBrand } from '@/lib/store';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { BrandGuidelines, ApprovedFact, BrandColor } from '@/lib/types';

export function BrandGuidelines() {
  const brands = useStore((s) => s.brands);
  const guidelines = useStore((s) => s.guidelines);
  const { toast } = useToast();
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BrandGuidelines | null>(null);
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null);

  const current = guidelines.find((g) => g.brandId === selectedBrandId);
  const currentBrand = brands.find((b) => b.id === selectedBrandId);

  const startEdit = () => {
    if (!current) return;
    setDraft(structuredClone(current));
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const save = () => {
    if (!draft) return;
    saveGuidelines(draft);
    setEditing(false);
    setDraft(null);
    toast('success', 'Brand guidelines saved. Future audits will use the updated rules.');
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) {
      toast('error', 'Brand name is required.');
      return;
    }
    const b = addBrand(newBrandName.trim(), newBrandDesc.trim());
    setSelectedBrandId(b.id);
    setNewBrandName('');
    setNewBrandDesc('');
    setAddBrandOpen(false);
    toast('success', `Brand "${b.name}" created with empty guidelines.`);
  };

  const handleDeleteBrand = () => {
    if (!deleteBrandId) return;
    deleteBrand(deleteBrandId);
    const remaining = brands.filter((b) => b.id !== deleteBrandId);
    setSelectedBrandId(remaining[0]?.id ?? '');
    setDeleteBrandId(null);
    toast('success', 'Brand and its guidelines have been deleted.');
  };

  if (brands.length === 0) {
    return (
      <EmptyState
        icon={BookMarked}
        title="No brands yet"
        message="Create a brand to manage its compliance guidelines."
        action={
          <button onClick={() => setAddBrandOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors">
            <Plus className="h-4 w-4" /> Add Brand
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Guidelines"
        description="Manage the rules that power every compliance audit."
        action={
          <button onClick={() => setAddBrandOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Brand
          </button>
        }
      />

      {/* Brand selector */}
      <div className="flex flex-wrap items-center gap-2">
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => { setSelectedBrandId(b.id); setEditing(false); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedBrandId === b.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {current && currentBrand && (
        <>
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentBrand.name}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{current.description}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                      <X className="h-4 w-4" /> Cancel
                    </button>
                    <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
                      <Save className="h-4 w-4" /> Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
                      <BookMarked className="h-4 w-4" /> Edit Guidelines
                    </button>
                    <button onClick={() => setDeleteBrandId(currentBrand.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800/80 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {editing && draft ? (
            <GuidelineEditor draft={draft} setDraft={setDraft} />
          ) : (
            <GuidelineView guidelines={current} />
          )}
        </>
      )}

      {/* Add brand modal */}
      {addBrandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setAddBrandOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Brand</h3>
              <button onClick={() => setAddBrandOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Brand Name</label>
                <input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60 focus:border-indigo-400 dark:focus:border-indigo-500"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60 focus:border-indigo-400 dark:focus:border-indigo-500"
                  placeholder="Brief brand description..."
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAddBrandOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleAddBrand} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm">Create Brand</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteBrandId}
        title="Delete brand?"
        message="This permanently removes the brand and all of its guidelines. Audits already created will keep their stored data."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteBrand}
        onCancel={() => setDeleteBrandId(null)}
      />
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof BookMarked; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> {title}
      </h3>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

function ListView({ items, emptyHint }: { items: string[]; emptyHint: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-400 dark:text-slate-500 italic">{emptyHint}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function GuidelineView({ guidelines }: { guidelines: BrandGuidelines }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section icon={Megaphone} title="Approved Slogans">
        <ListView items={guidelines.approvedSlogans} emptyHint="No approved slogans." />
      </Section>
      <Section icon={Type} title="Voice & Tone">
        <ListView items={guidelines.voiceAndTone} emptyHint="No voice attributes defined." />
      </Section>
      <Section icon={Hash} title="Preferred Words">
        <ListView items={guidelines.preferredWords} emptyHint="No preferred words." />
      </Section>
      <Section icon={Shield} title="Prohibited Words">
        <ListView items={guidelines.prohibitedWords} emptyHint="No prohibited words." />
      </Section>
      <Section icon={FileText} title="Restricted Claims">
        <ListView items={guidelines.restrictedClaims} emptyHint="No restricted claims." />
      </Section>
      <Section icon={Shield} title="Required Disclaimers">
        <ListView items={guidelines.requiredDisclaimers} emptyHint="No required disclaimers." />
      </Section>
      <Section icon={FileText} title="Approved Facts & Statistics">
        {guidelines.approvedFacts.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">No approved facts.</p>
        ) : (
          <ul className="space-y-2">
            {guidelines.approvedFacts.map((f) => (
              <li key={f.id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.claim}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Source: {f.source} · {f.category}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section icon={Eye} title="Logo Usage Rules">
        <ListView items={guidelines.logoRules} emptyHint="No logo rules." />
      </Section>
      <Section icon={Palette} title="Brand Colors">
        {guidelines.brandColors.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">No brand colors.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {guidelines.brandColors.map((c) => (
              <div key={c.name} className="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-3 py-2">
                <span className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm shrink-0" style={{ background: c.hex }} />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section icon={Accessibility} title="Accessibility Requirements">
        <ListView items={guidelines.accessibilityRequirements} emptyHint="No accessibility requirements." />
      </Section>
    </div>
  );
}

function GuidelineEditor({ draft, setDraft }: { draft: BrandGuidelines; setDraft: (g: BrandGuidelines) => void }) {
  const update = (patch: Partial<BrandGuidelines>) => setDraft({ ...draft, ...patch });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Brand Description</label>
        <textarea
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60"
        />
      </Card>
      <StringListEditor label="Approved Slogans" items={draft.approvedSlogans} onChange={(v) => update({ approvedSlogans: v })} placeholder="e.g. Technology That Moves You Forward" />
      <StringListEditor label="Voice & Tone" items={draft.voiceAndTone} onChange={(v) => update({ voiceAndTone: v })} placeholder="e.g. Professional" />
      <StringListEditor label="Preferred Words" items={draft.preferredWords} onChange={(v) => update({ preferredWords: v })} placeholder="e.g. reliable" />
      <StringListEditor label="Prohibited Words" items={draft.prohibitedWords} onChange={(v) => update({ prohibitedWords: v })} placeholder="e.g. cheap" />
      <StringListEditor label="Restricted Claims" items={draft.restrictedClaims} onChange={(v) => update({ restrictedClaims: v })} placeholder="e.g. Numerical claims require evidence." />
      <StringListEditor label="Required Disclaimers" items={draft.requiredDisclaimers} onChange={(v) => update({ requiredDisclaimers: v })} placeholder="e.g. Offer valid for new customers only." />
      <StringListEditor label="Logo Usage Rules" items={draft.logoRules} onChange={(v) => update({ logoRules: v })} placeholder="e.g. Logo minimum width 120px." />
      <StringListEditor label="Accessibility Requirements" items={draft.accessibilityRequirements} onChange={(v) => update({ accessibilityRequirements: v })} placeholder="e.g. Contrast ratio at least 4.5:1." />

      {/* Facts editor */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Approved Facts & Statistics</h3>
        <div className="space-y-2">
          {draft.approvedFacts.map((f, i) => (
            <div key={f.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/60 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Fact {i + 1}</span>
                <button onClick={() => update({ approvedFacts: draft.approvedFacts.filter((x) => x.id !== f.id) })} className="text-red-500 hover:text-red-700 dark:hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                value={f.claim}
                onChange={(e) => update({ approvedFacts: draft.approvedFacts.map((x) => x.id === f.id ? { ...x, claim: e.target.value } : x) })}
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                placeholder="Claim"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  value={f.source}
                  onChange={(e) => update({ approvedFacts: draft.approvedFacts.map((x) => x.id === f.id ? { ...x, source: e.target.value } : x) })}
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                  placeholder="Source"
                />
                <input
                  value={f.category}
                  onChange={(e) => update({ approvedFacts: draft.approvedFacts.map((x) => x.id === f.id ? { ...x, category: e.target.value } : x) })}
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                  placeholder="Category"
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => update({ approvedFacts: [...draft.approvedFacts, { id: `fact-${Date.now()}`, claim: '', source: '', category: '' } as ApprovedFact] })}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add fact
          </button>
        </div>
      </Card>

      {/* Colors editor */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Brand Colors</h3>
        <div className="space-y-2">
          {draft.brandColors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={c.hex}
                onChange={(e) => update({ brandColors: draft.brandColors.map((x, idx) => idx === i ? { ...x, hex: e.target.value } : x) })}
                className="h-8 w-10 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
              />
              <input
                value={c.name}
                onChange={(e) => update({ brandColors: draft.brandColors.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x) })}
                className="flex-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                placeholder="Name"
              />
              <input
                value={c.usage}
                onChange={(e) => update({ brandColors: draft.brandColors.map((x, idx) => idx === i ? { ...x, usage: e.target.value } : x) })}
                className="flex-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                placeholder="Usage"
              />
              <button onClick={() => update({ brandColors: draft.brandColors.filter((_, idx) => idx !== i) })} className="text-red-500 hover:text-red-700 dark:hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => update({ brandColors: [...draft.brandColors, { name: '', hex: '#000000', usage: '' } as BrandColor] })}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add color
          </button>
        </div>
      </Card>
    </div>
  );
}

function StringListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{label}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => onChange(items.map((x, idx) => idx === i ? e.target.value : x))}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/60 transition-colors"
              placeholder={placeholder}
            />
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 dark:hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ''])} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      </div>
    </Card>
  );
}
