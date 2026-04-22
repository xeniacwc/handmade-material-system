import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { ShoppingItem } from '../../store/useStore';
import { Package, Trash2, CheckCircle, Store, Plus, X } from 'lucide-react';
import { BatchPriceInput } from '../../components/BatchPriceInput';
import { toast } from '../../components/Toast';

/* ── Bottom Sheet: Source Picker ── */
function SourcePicker({ currentSourceId, sources, onSelect, onClose }: {
  currentSourceId: string | null;
  sources: { id: string; name: string }[];
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom duration-300 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">選擇進貨來源</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          <button
            onClick={() => { onSelect(null); onClose(); }}
            className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${!currentSourceId ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
          >
            <Store size={16} /> 未指定來源
          </button>
          {sources.map(s => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); onClose(); }}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${currentSourceId === s.id ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <Store size={16} /> {s.name}
              {currentSourceId === s.id && <CheckCircle size={15} className="ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ShoppingList() {
  const navigate = useNavigate();
  const { shoppingItems, materials, sources, updateShoppingItem, removeShoppingItem, checkoutShoppingItems } = useStore();

  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [sourcePickerItemId, setSourcePickerItemId] = useState<string | null>(null);

  // Group by sourceId
  const groupedItems = shoppingItems.reduce((acc, item) => {
    const sId = item.sourceId || 'unassigned';
    if (!acc[sId]) acc[sId] = [];
    acc[sId].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const toggleSourceSelection = (sId: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]
    );
  };

  const handleCheckout = () => {
    const itemsToCheckout = selectedSourceIds.flatMap(sId => groupedItems[sId] || []);
    if (itemsToCheckout.length === 0) return;

    const invalidItems = itemsToCheckout.filter(i => !i.quantity || i.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error('請確認所有選取項目的數量已填妥！');
      return;
    }

    checkoutShoppingItems(itemsToCheckout);
    setSelectedSourceIds([]);
    toast.success(`批次入庫完成，共 ${itemsToCheckout.length} 項材料！`);
  };

  const sourcePickerItem = sourcePickerItemId ? shoppingItems.find(i => i.id === sourcePickerItemId) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-16">
      <header className="flex items-center justify-between px-4 pt-5 pb-3 bg-white border-b">
        <div>
          <h1 className="text-2xl font-bold text-foreground">進貨清單</h1>
          <p className="text-sm text-foreground/50 mt-0.5">共 {shoppingItems.length} 項待進貨</p>
        </div>
        <button onClick={() => navigate('/materials/new?redirect=restock')} className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform" title="建立新材料並加入清單">
          <Plus size={16} /> 新增材料
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {shoppingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 mt-20">
            <Package size={48} className="mb-4 stroke-[1.5]" />
            <p className="text-sm">進貨清單目前是空的</p>
            <p className="text-xs mt-2">到材料庫批次選取材料，或點右上角建立新材料</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.keys(groupedItems).map(sId => {
              const sourceName = sId === 'unassigned' ? '未指定進貨來源' : sources.find(s => s.id === sId)?.name || '未知來源';
              const items = groupedItems[sId];
              const isSelected = selectedSourceIds.includes(sId);

              let totalEstimate = 0;
              items.forEach(i => { if (i.quantity > 0 && i.unitCost > 0) totalEstimate += i.quantity * i.unitCost; });

              return (
                <div key={sId} className={`bg-white rounded-2xl border transition-all ${isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200'}`}>
                  {/* Source header — tap to select for checkout */}
                  <div
                    className="flex justify-between items-center p-4 border-b bg-gray-50/50 rounded-t-2xl cursor-pointer"
                    onClick={() => toggleSourceSelection(sId)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                        {isSelected && <CheckCircle size={14} />}
                      </div>
                      <Store size={16} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                      <span className="font-bold text-sm">{sourceName}</span>
                    </div>
                    <span className="text-xs text-gray-500">{items.length} 項</span>
                  </div>

                  <div className="p-4 flex flex-col gap-5">
                    {items.map((item, idx) => {
                      const material = materials.find(m => m.id === item.materialId);
                      if (!material) return null;
                      const currentSource = sources.find(s => s.id === item.sourceId);

                      return (
                        <div key={item.id} className={idx < items.length - 1 ? 'border-b pb-5' : ''}>
                          <div className="flex gap-3 mb-3">
                            <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                              {material.image
                                ? <img src={material.image} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">無圖</div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm leading-tight line-clamp-2 flex-1 mr-2">{material.name}</h4>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeShoppingItem(item.id); }}
                                  className="text-gray-300 p-1 hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                              {/* Source selector — tap to open bottom sheet */}
                              <button
                                onClick={e => { e.stopPropagation(); setSourcePickerItemId(item.id); }}
                                className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-primary transition-colors"
                              >
                                <Store size={12} />
                                <span>{currentSource?.name || '未指定來源'}</span>
                                <span className="text-primary/70">（點擊更改）</span>
                              </button>
                            </div>
                          </div>

                          <BatchPriceInput
                            compact
                            initialQuantity={item.quantity}
                            initialUnitCost={item.unitCost}
                            initialTotalPrice={item.quantity > 0 && item.unitCost > 0 ? item.quantity * item.unitCost : undefined}
                            onChange={(q, u) => updateShoppingItem(item.id, { quantity: q, unitCost: u })}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {totalEstimate > 0 && (
                    <div className="bg-primary/5 p-3 rounded-b-2xl border-t flex justify-between items-center px-4">
                      <span className="text-xs text-primary font-bold">預估小計</span>
                      <span className="font-bold text-lg text-primary">{Math.round(totalEstimate).toLocaleString()} 元</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom sheet source picker */}
      {sourcePickerItemId && sourcePickerItem && (
        <SourcePicker
          currentSourceId={sourcePickerItem.sourceId}
          sources={sources}
          onSelect={(id) => updateShoppingItem(sourcePickerItemId, { sourceId: id })}
          onClose={() => setSourcePickerItemId(null)}
        />
      )}

      {/* Checkout bar */}
      {selectedSourceIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-4 bg-gray-900 text-white rounded-2xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-5 z-40">
          <span className="text-sm font-bold">已選 {selectedSourceIds.length} 個來源</span>
          <button
            onClick={handleCheckout}
            className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-black active:scale-95 transition-transform"
          >
            確認入庫
          </button>
        </div>
      )}
    </div>
  );
}
