import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import type { MaterialBatch } from '../../store/useStore';
import {
  ClipboardList, Plus, X, Store, Calendar, ChevronRight,
  Package, CheckCircle, Search,
} from 'lucide-react';
import { toast } from '../../components/Toast';
import { btn, tx, layout } from '../../lib/design';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function totalCost(b: MaterialBatch) {
  return (b.totalPrice || 0) + (b.shippingFee || 0) + (b.handlingFee || 0);
}

// ─── Source Picker Sheet ──────────────────────────────────────────────────────
function SourcePickerSheet({
  currentId, sources, onSelect, onClose,
}: {
  currentId: string | null;
  sources: { id: string; name: string }[];
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const { addSource } = useStore();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const t = newName.trim();
    if (!t) return;
    const id = crypto.randomUUID();
    addSource({ id, name: t });
    onSelect(id);
    setNewName('');
    toast.success(`已新增來源「${t}」`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl p-6 pb-safe max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">選擇進貨管道</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 mb-4">
          <button onClick={() => { onSelect(null); onClose(); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors text-left ${!currentId ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
            <Store size={16} /> 未指定管道
            {!currentId && <CheckCircle size={15} className="ml-auto" />}
          </button>
          {sources.map(s => (
            <button key={s.id} onClick={() => { onSelect(s.id); onClose(); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors text-left ${currentId === s.id ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
              <Store size={16} /> {s.name}
              {currentId === s.id && <CheckCircle size={15} className="ml-auto" />}
            </button>
          ))}
        </div>
        <div className="flex gap-2 border-t pt-4">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="新增管道..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          <button onClick={handleAdd} disabled={!newName.trim()} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform">新增</button>
        </div>
      </div>
    </div>
  );
}

// ─── Material Picker Sheet ────────────────────────────────────────────────────
function MaterialPickerSheet({
  onSelect, onClose,
}: {
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { materials } = useStore();
  const [q, setQ] = useState('');
  const filtered = materials.filter(m => m.name.includes(q));

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl p-6 pb-safe max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">選擇材料</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋材料..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:border-primary outline-none" />
        </div>
        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">找不到材料</p>
          ) : filtered.map(m => (
            <button key={m.id} onClick={() => { onSelect(m.id); onClose(); }} className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                {m.image ? <img src={m.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={16} /></div>}
              </div>
              <span className="flex-1 min-w-0 truncate">{m.name}</span>
              <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Batch Sheet ───────────────────────────────────────────────────
interface BatchFormData {
  materialId: string;
  sourceId: string | null;
  quantity: number;
  unitCost: number;
  shippingFee: number;
  handlingFee: number;
  notes: string;
}

function BatchFormSheet({
  initial,
  editingBatch,
  onSave,
  onClose,
  sources,
}: {
  initial?: Partial<BatchFormData>;
  editingBatch?: MaterialBatch;
  onSave: (data: BatchFormData) => void;
  onClose: () => void;
  sources: { id: string; name: string }[];
}) {
  const { materials } = useStore();
  const [form, setForm] = useState<BatchFormData>({
    materialId: initial?.materialId || editingBatch?.materialId || '',
    sourceId: initial?.sourceId ?? editingBatch?.sourceId ?? null,
    quantity: initial?.quantity ?? editingBatch?.quantity ?? 0,
    unitCost: initial?.unitCost ?? editingBatch?.unitCost ?? 0,
    shippingFee: initial?.shippingFee ?? editingBatch?.shippingFee ?? 0,
    handlingFee: initial?.handlingFee ?? editingBatch?.handlingFee ?? 0,
    notes: initial?.notes ?? editingBatch?.notes ?? '',
  });
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);

  const isEdit = !!editingBatch;
  const selectedMaterial = materials.find(m => m.id === form.materialId);
  const selectedSource = sources.find(s => s.id === form.sourceId);
  const productTotal = (form.unitCost || 0) * (form.quantity || 0);
  const grandTotal = productTotal + (form.shippingFee || 0) + (form.handlingFee || 0);

  const set = (k: keyof BatchFormData) => (v: string | number | null) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.materialId) { toast.error('請選擇材料'); return; }
    if (!form.quantity || form.quantity <= 0) { toast.error('請填寫數量'); return; }
    onSave(form);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end animate-in fade-in duration-200" onClick={onClose}>
        <div className="w-full bg-white rounded-t-3xl pb-safe animate-in slide-in-from-bottom duration-300 shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b">
            <h3 className="font-bold text-xl">{isEdit ? '編輯進貨紀錄' : '手動新增進貨'}</h3>
            <button onClick={onClose} className="text-gray-400 bg-gray-100 p-2 rounded-full"><X size={18} /></button>
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            <div className="flex flex-col gap-5">
              {/* Material Picker */}
              {!isEdit && (
                <div>
                  <label className={`block ${tx.label} mb-1.5`}>材料 *</label>
                  <button type="button" onClick={() => setShowMaterialPicker(true)} className="w-full flex items-center gap-3 p-3 rounded-xl border bg-gray-50 text-sm text-left hover:border-primary transition-colors">
                    {selectedMaterial ? (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                          {selectedMaterial.image ? <img src={selectedMaterial.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={14} /></div>}
                        </div>
                        <span className="font-medium text-foreground">{selectedMaterial.name}</span>
                        <ChevronRight size={14} className="ml-auto text-gray-300" />
                      </>
                    ) : (
                      <>
                        <Package size={16} className="text-gray-400" />
                        <span className="text-gray-400">點擊選擇材料...</span>
                        <ChevronRight size={14} className="ml-auto text-gray-300" />
                      </>
                    )}
                  </button>
                </div>
              )}
              {isEdit && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {selectedMaterial?.image ? <img src={selectedMaterial.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={14} /></div>}
                  </div>
                  <span className="text-sm font-medium text-foreground">{selectedMaterial?.name || '未知材料'}</span>
                </div>
              )}

              {/* Source Picker */}
              <div>
                <label className={`block ${tx.label} mb-1.5`}>進貨管道</label>
                <button type="button" onClick={() => setShowSourcePicker(true)} className="w-full flex items-center gap-2 p-3 rounded-xl border bg-gray-50 text-sm text-left hover:border-primary transition-colors">
                  <Store size={16} className="text-gray-400 flex-shrink-0" />
                  <span className={selectedSource ? 'text-foreground font-medium' : 'text-gray-400'}>
                    {selectedSource?.name || '點擊選擇管道...'}
                  </span>
                  <ChevronRight size={14} className="ml-auto text-gray-300" />
                </button>
              </div>

              {/* Quantity + Unit Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block ${tx.label} mb-1.5`}>數量 *</label>
                  <input
                    type="number" inputMode="decimal" min="0" step="any"
                    value={form.quantity || ''}
                    onChange={e => set('quantity')(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className={`block ${tx.label} mb-1.5`}>每單位售價（元）</label>
                  <input
                    type="number" inputMode="decimal" min="0" step="any"
                    value={form.unitCost || ''}
                    onChange={e => set('unitCost')(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Product subtotal display */}
              {productTotal > 0 && (
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex justify-between items-center">
                  <span className={tx.label}>商品小計</span>
                  <span className="text-sm font-bold">{productTotal.toLocaleString()} 元</span>
                </div>
              )}

              {/* Shipping + Handling */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block ${tx.label} mb-1.5`}>運費（元）</label>
                  <input
                    type="number" inputMode="decimal" min="0" step="any"
                    value={form.shippingFee || ''}
                    onChange={e => set('shippingFee')(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className={`block ${tx.label} mb-1.5`}>手續費（元）</label>
                  <input
                    type="number" inputMode="decimal" min="0" step="any"
                    value={form.handlingFee || ''}
                    onChange={e => set('handlingFee')(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Grand total */}
              <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-bold text-primary">此次合計花費</span>
                <span className="text-lg font-black text-primary">{grandTotal.toLocaleString()} 元</span>
              </div>

              {/* Notes */}
              <div>
                <label className={`block ${tx.label} mb-1.5`}>備注</label>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes')(e.target.value)}
                  placeholder="輸入備注..."
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="p-6 pt-0">
            <button onClick={handleSave} className={btn.primary}>
              {isEdit ? '儲存變更' : '新增進貨紀錄'}
            </button>
          </div>
        </div>
      </div>

      {showSourcePicker && (
        <SourcePickerSheet
          currentId={form.sourceId}
          sources={sources}
          onSelect={id => setForm(f => ({ ...f, sourceId: id }))}
          onClose={() => setShowSourcePicker(false)}
        />
      )}
      {showMaterialPicker && (
        <MaterialPickerSheet
          onSelect={id => setForm(f => ({ ...f, materialId: id }))}
          onClose={() => setShowMaterialPicker(false)}
        />
      )}
    </>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────
function BatchCard({ batch, onEdit }: { batch: MaterialBatch; onEdit: () => void }) {
  const { materials, sources, types } = useStore();
  const material = materials.find(m => m.id === batch.materialId);
  const source = sources.find(s => s.id === batch.sourceId);
  const type = types.find(t => t.id === material?.typeId);
  const grand = totalCost(batch);
  const hasExtra = (batch.shippingFee || 0) + (batch.handlingFee || 0) > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={13} />
          <span>{formatDate(batch.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {source && (
            <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
              <Store size={11} /> {source.name}
            </span>
          )}
          <button onClick={onEdit} className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium hover:bg-gray-200 transition-colors active:scale-95">
            編輯
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Material info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
            {material?.image ? <img src={material.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={18} /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight truncate">{material?.name || '未知材料'}</p>
            <p className={`${tx.meta} mt-0.5`}>
              數量：{batch.quantity} {type?.defaultUnit || ''} ／ 剩餘：{batch.remaining}
            </p>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className={tx.label}>商品金額</span>
            <span className="text-sm font-medium">{(batch.totalPrice || 0).toLocaleString()} 元</span>
          </div>
          {(batch.shippingFee || 0) > 0 && (
            <div className="flex justify-between items-center">
              <span className={tx.label}>運費</span>
              <span className="text-sm font-medium">{(batch.shippingFee || 0).toLocaleString()} 元</span>
            </div>
          )}
          {(batch.handlingFee || 0) > 0 && (
            <div className="flex justify-between items-center">
              <span className={tx.label}>手續費</span>
              <span className="text-sm font-medium">{(batch.handlingFee || 0).toLocaleString()} 元</span>
            </div>
          )}
          {hasExtra && <div className="border-t border-gray-200 pt-1.5" />}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-primary">合計花費</span>
            <span className="text-base font-black text-primary">{grand.toLocaleString()} 元</span>
          </div>
        </div>

        {/* Notes */}
        {batch.notes && (
          <p className="mt-3 text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">
            📝 {batch.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function PurchaseHistory() {
  const { batches, sources, addBatch, updateBatch } = useStore();

  const [filterSourceId, setFilterSourceId] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<MaterialBatch | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  // Sort & filter
  const sorted = useMemo(
    () => [...batches].sort((a, b) => b.createdAt - a.createdAt),
    [batches]
  );
  const filtered = filterSourceId ? sorted.filter(b => b.sourceId === filterSourceId) : sorted;

  // Sources that have at least one batch
  const usedSources = useMemo(() =>
    sources.filter(s => batches.some(b => b.sourceId === s.id)),
    [sources, batches]
  );

  // Summary stats
  const totalSpent = filtered.reduce((sum, b) => sum + totalCost(b), 0);

  const handleAdd = (data: BatchFormData) => {
    addBatch({
      id: crypto.randomUUID(),
      materialId: data.materialId,
      sourceId: data.sourceId,
      totalPrice: (data.unitCost || 0) * (data.quantity || 0),
      quantity: data.quantity,
      remaining: data.quantity,
      unitCost: data.unitCost,
      shippingFee: data.shippingFee,
      handlingFee: data.handlingFee,
      notes: data.notes,
      createdAt: Date.now(),
    });
    setShowAddSheet(false);
    toast.success('進貨紀錄已新增！');
  };

  const handleEdit = (data: BatchFormData) => {
    if (!editingBatch) return;
    updateBatch(editingBatch.id, {
      sourceId: data.sourceId,
      totalPrice: (data.unitCost || 0) * (data.quantity || 0),
      quantity: data.quantity,
      unitCost: data.unitCost,
      shippingFee: data.shippingFee,
      handlingFee: data.handlingFee,
      notes: data.notes,
    });
    setEditingBatch(null);
    toast.success('進貨紀錄已更新！');
  };

  return (
    <div className="min-h-full">
      {/* ── PAGE HEADER ── */}
      <header className={layout.pageHeader}>
        <div className={layout.pageHeaderRow}>
          <div>
            <h1 className={tx.pageTitle}>進貨紀錄</h1>
            <p className={tx.meta}>{batches.length} 筆紀錄</p>
          </div>
          <button onClick={() => setShowAddSheet(true)} className={btn.secondary}>
            <Plus size={14} /> 手動新增
          </button>
        </div>
      </header>

      {/* ── SOURCE FILTER CHIPS ── */}
      {usedSources.length > 0 && (
        <div className="px-4 pt-4 pb-0 max-w-5xl mx-auto overflow-x-auto">
          <div className="flex gap-2 w-max pb-1">
            <button onClick={() => setFilterSourceId(null)} className={filterSourceId === null ? btn.chipOn : btn.chipOff}>
              全部
            </button>
            {usedSources.map(s => (
              <button key={s.id} onClick={() => setFilterSourceId(filterSourceId === s.id ? null : s.id)} className={filterSourceId === s.id ? btn.chipOn : btn.chipOff}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SUMMARY BAR ── */}
      {filtered.length > 0 && (
        <div className="px-4 pt-3 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 rounded-2xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className={tx.label}>{filterSourceId ? `管道「${sources.find(s => s.id === filterSourceId)?.name}」總花費` : '全部管道總花費'}</p>
              <p className="text-xs text-foreground/40 mt-0.5">{filtered.length} 筆紀錄</p>
            </div>
            <p className="text-2xl font-black text-primary">{totalSpent.toLocaleString()} <span className="text-sm font-normal">元</span></p>
          </div>
        </div>
      )}

      {/* ── BATCH LIST ── */}
      <div className={`${layout.body} py-4`}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 mt-20">
            <ClipboardList size={48} className="mb-4 stroke-[1.5]" />
            <p className="text-sm">尚無進貨紀錄</p>
            <p className="text-xs mt-2">點右上角手動新增，或從材料詳情頁登錄進貨</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(b => (
              <BatchCard key={b.id} batch={b} onEdit={() => setEditingBatch(b)} />
            ))}
          </div>
        )}
      </div>

      {/* ── EDIT SHEET ── */}
      {editingBatch && (
        <BatchFormSheet
          editingBatch={editingBatch}
          sources={sources}
          onSave={handleEdit}
          onClose={() => setEditingBatch(null)}
        />
      )}

      {/* ── ADD SHEET ── */}
      {showAddSheet && (
        <BatchFormSheet
          sources={sources}
          onSave={handleAdd}
          onClose={() => setShowAddSheet(false)}
        />
      )}
    </div>
  );
}
