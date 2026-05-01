import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Edit2, Plus, Box, Calendar, Store, ShoppingCart, X, CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { BatchPriceInput } from '../../components/BatchPriceInput';
import { toast } from '../../components/Toast';

/* ── Bottom Sheet: Source Picker ── */
function SourcePicker({ currentSourceId, sources, onSelect, onClose }: {
  currentSourceId: string | null;
  sources: { id: string; name: string }[];
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState('');
  const { addSource } = useStore();

  const handleAddNew = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    addSource({ id, name: trimmed });
    onSelect(id);
    onClose();
    toast.success(`已新增進貨來源「${trimmed}」`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom duration-300 shadow-2xl max-h-[75vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">選擇進貨來源</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 mb-4">
          <button
            onClick={() => { onSelect(null); onClose(); }}
            className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors text-left ${!currentSourceId ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
          >
            <Store size={16} /> 未指定來源
            {!currentSourceId && <CheckCircle size={15} className="ml-auto" />}
          </button>
          {sources.map(s => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); onClose(); }}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors text-left ${currentSourceId === s.id ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <Store size={16} /> {s.name}
              {currentSourceId === s.id && <CheckCircle size={15} className="ml-auto" />}
            </button>
          ))}
        </div>
        {/* Add new source inline */}
        <div className="flex gap-2 border-t pt-4">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNew()}
            placeholder="新增進貨來源..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <button
            onClick={handleAddNew}
            disabled={!newName.trim()}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform"
          >
            新增
          </button>
        </div>
      </div>
    </div>
  );
}

export function MaterialDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { materials, batches, types, tags, sources, addBatch, addShoppingItem } = useStore();

  const material = materials.find(m => m.id === id);
  const materialBatches = batches.filter(b => b.materialId === id).sort((a, b) => b.createdAt - a.createdAt);
  const type = types.find(t => t.id === material?.typeId);

  const [showBatchForm, setShowBatchForm] = useState(false);
  const [filterSourceId, setFilterSourceId] = useState('');
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  // Batch Form State
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [handlingFee, setHandlingFee] = useState(0);
  const [batchNotes, setBatchNotes] = useState('');

  if (!material) {
    return <div className="p-8 text-center text-gray-500">找不到材料</div>;
  }

  const selectedSourceName = selectedSourceId ? sources.find(s => s.id === selectedSourceId)?.name : null;

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) { toast.error('請填寫數量'); return; }

    const productTotal = totalPrice || (unitCost * quantity);
    addBatch({
      id: crypto.randomUUID(),
      materialId: material.id,
      sourceId: selectedSourceId,
      totalPrice: productTotal,
      quantity,
      remaining: quantity,
      unitCost,
      shippingFee,
      handlingFee,
      notes: batchNotes,
      createdAt: Date.now()
    });
    setShowBatchForm(false);
    setTotalPrice(0); setQuantity(0); setUnitCost(0); setSelectedSourceId(null);
    setShippingFee(0); setHandlingFee(0); setBatchNotes('');
    toast.success('進貨紀錄已登錄！');
  };

  const totalRemaining = materialBatches.reduce((s, b) => s + b.remaining, 0);
  const totalQtyBought = materialBatches.reduce((s, b) => s + b.quantity, 0);
  const totalCostBought = materialBatches.reduce((s, b) => s + b.totalPrice, 0);
  const avgCost = totalQtyBought > 0 ? Math.round(totalCostBought / totalQtyBought) : 0;

  const filteredBatches = filterSourceId ? materialBatches.filter(b => b.sourceId === filterSourceId) : materialBatches;

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-300">
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b">
        <button onClick={() => navigate('/materials')} className="p-2 -ml-2 text-foreground/70"><ChevronLeft size={24} /></button>
        <h1 className="text-lg font-bold">材料詳情</h1>
        <button onClick={() => navigate(`/materials/${id}/edit`)} className="p-2 -mr-2 text-primary font-bold"><Edit2 size={20} /></button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Material Header */}
        <div className="bg-white p-6 shadow-sm border-b">
          <div className="flex gap-6">
            <div className="w-28 h-28 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
              {material.image
                ? <img src={material.image} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300"><Box size={32} /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">{type?.name}</span>
              <h2 className="text-2xl font-bold text-foreground mt-2 break-words leading-tight">{material.name}</h2>
              <div className="flex flex-wrap gap-1 mt-3">
                {material.tagIds.map(tid => {
                  const tag = tags.find(x => x.id === tid);
                  return tag && <span key={tid} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{tag.name}</span>;
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex bg-background p-4 rounded-2xl border justify-between items-center text-center">
            <div className="flex-1 border-r border-gray-200">
              <p className="text-xs text-gray-500 mb-1">總庫存</p>
              <p className="text-xl font-bold text-foreground">{totalRemaining.toFixed(1)} <span className="text-xs font-normal text-gray-500">{type?.defaultUnit}</span></p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">歷史平均單價</p>
              <p className="text-xl font-bold text-primary">{avgCost} 元</p>
            </div>
          </div>
          {materialBatches.length > 0 && (
            <p className="text-center text-[10px] text-gray-400 mt-2">基於 {materialBatches.length} 筆進貨紀錄計算</p>
          )}
        </div>

        {/* Batches Section */}
        <div className="p-4 mt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-foreground">進貨紀錄</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  addShoppingItem({ id: crypto.randomUUID(), materialId: material.id, sourceId: null, quantity: 1, unitCost: 0, createdAt: Date.now() });
                  toast.success('已加入進貨清單！');
                }}
                className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-transform"
              >
                <ShoppingCart size={16} /> 加入清單
              </button>
              <button
                onClick={() => setShowBatchForm(true)}
                className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-transform"
              >
                <Plus size={16} /> 登錄進貨
              </button>
            </div>
          </div>

          {/* Source filter chips */}
          {materialBatches.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFilterSourceId('')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${filterSourceId === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                全部
              </button>
              {Array.from(new Set(materialBatches.map(b => b.sourceId).filter(Boolean))).map(sid => {
                const source = sources.find(s => s.id === sid);
                if (!source) return null;
                return (
                  <button
                    key={source.id}
                    onClick={() => setFilterSourceId(source.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${filterSourceId === source.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {source.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {filteredBatches.map(b => {
              const source = sources.find(s => s.id === b.sourceId);
              return (
                <div key={b.id} className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start border-b pb-2">
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Calendar size={14} />
                      <span>{new Date(b.createdAt).toLocaleDateString('zh-TW')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Store size={14} />
                      <span>{source?.name || '未指定來源'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">取得數量 (剩餘 <span className="font-bold text-gray-600">{b.remaining}</span>)</p>
                      <p className="text-lg font-bold">{b.quantity} <span className="text-sm font-normal text-gray-500">{type?.defaultUnit}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 mb-0.5">單價（總計 {b.totalPrice} 元）</p>
                      <p className="text-lg font-bold text-primary">{b.unitCost} 元</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredBatches.length === 0 && (
              <div className="py-10 text-center text-gray-400 bg-white border border-dashed rounded-2xl">
                <p>尚無進貨紀錄</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Batch Bottom Sheet */}
      {showBatchForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-3xl pb-safe animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center p-6 pb-4 border-b">
              <h3 className="font-bold text-xl">登錄進貨</h3>
              <button onClick={() => setShowBatchForm(false)} className="text-gray-400 bg-gray-100 p-2 rounded-full"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleAddBatch} className="flex flex-col gap-4">
                {/* Source picker button */}
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">進貨管道</label>
                  <button
                    type="button"
                    onClick={() => setShowSourcePicker(true)}
                    className="w-full flex items-center gap-2 p-3 rounded-xl border bg-gray-50 text-sm text-left hover:border-primary transition-colors"
                  >
                    <Store size={16} className="text-gray-400" />
                    <span className={selectedSourceName ? 'text-foreground font-medium' : 'text-gray-400'}>
                      {selectedSourceName || '點擊選擇進貨管道...'}
                    </span>
                  </button>
                </div>

                <div>
                  <BatchPriceInput
                    defaultUnit={type?.defaultUnit}
                    onChange={(q, u, t) => { setQuantity(q); setUnitCost(u); setTotalPrice(t); }}
                  />
                </div>

                {/* Shipping + Handling */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground/60 mb-1">運費（元）</label>
                    <input
                      type="number" inputMode="decimal" min="0" step="any"
                      value={shippingFee || ''}
                      onChange={e => setShippingFee(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/60 mb-1">手續費（元）</label>
                    <input
                      type="number" inputMode="decimal" min="0" step="any"
                      value={handlingFee || ''}
                      onChange={e => setHandlingFee(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* Grand total */}
                {(quantity > 0 || shippingFee > 0 || handlingFee > 0) && (
                  <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-sm font-bold text-primary">此次合計花費</span>
                    <span className="text-lg font-black text-primary">
                      {((totalPrice || (unitCost * quantity)) + shippingFee + handlingFee).toLocaleString()} 元
                    </span>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">備注</label>
                  <textarea
                    value={batchNotes}
                    onChange={e => setBatchNotes(e.target.value)}
                    placeholder="輸入備注..."
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!quantity}
                  className="mt-1 w-full bg-primary text-white py-4 rounded-xl font-bold tracking-wider hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
                >
                  確認新增進貨
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Source Picker Sheet */}
      {showSourcePicker && (
        <SourcePicker
          currentSourceId={selectedSourceId}
          sources={sources}
          onSelect={(id) => setSelectedSourceId(id)}
          onClose={() => setShowSourcePicker(false)}
        />
      )}
    </div>
  );
}
