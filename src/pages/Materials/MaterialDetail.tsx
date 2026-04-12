import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Edit2, Plus, Box, Calendar, DollarSign, Store, Filter } from 'lucide-react';
import { useStore } from '../../store/useStore';


export function MaterialDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { materials, batches, types, tags, sources, addBatch, addSource } = useStore();

  const material = materials.find(m => m.id === id);
  const materialBatches = batches.filter(b => b.materialId === id).sort((a,b) => b.createdAt - a.createdAt);
  const type = types.find(t => t.id === material?.typeId);

  const [showBatchForm, setShowBatchForm] = useState(false);
  const [filterSourceId, setFilterSourceId] = useState('');
  
  // Batch Form State
  const [sourceInput, setSourceInput] = useState('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>('');

  if (!material) {
    return <div className="p-8 text-center text-gray-500">找不到材料</div>;
  }

  const handlePriceChange = (field: 'total' | 'qty' | 'unit', val: string) => {
    const num = parseFloat(val);
    if (field === 'total') {
      setTotalPrice(val);
      const q = parseFloat(quantity);
      if (q > 0 && !isNaN(num)) setUnitCost((num / q).toFixed(2));
    } else if (field === 'qty') {
      setQuantity(val);
      const t = parseFloat(totalPrice);
      if (t > 0 && num > 0) setUnitCost((t / num).toFixed(2));
    } else if (field === 'unit') {
      setUnitCost(val);
      const q = parseFloat(quantity);
      if (q > 0 && !isNaN(num)) setTotalPrice((num * q).toFixed(2));
    }
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(totalPrice);
    const q = parseFloat(quantity);
    const u = parseFloat(unitCost);
    
    let finalSourceId = null;
    if (sourceInput.trim()) {
      let existing = sources.find(s => s.name === sourceInput.trim());
      if (existing) {
        finalSourceId = existing.id;
      } else {
        const newId = crypto.randomUUID();
        addSource({ id: newId, name: sourceInput.trim() });
        finalSourceId = newId;
      }
    }

    if (q > 0 && u >= 0) {
      addBatch({
        id: crypto.randomUUID(),
        materialId: material.id,
        sourceId: finalSourceId,
        totalPrice: p || (u * q),
        quantity: q,
        remaining: q,
        unitCost: u,
        createdAt: Date.now()
      });
      setShowBatchForm(false);
      setTotalPrice(''); setQuantity(''); setUnitCost(''); setSourceInput('');
    }
  };

  const totalRemaining = materialBatches.reduce((s, b) => s + b.remaining, 0);
  const totalQtyBought = materialBatches.reduce((s, b) => s + b.quantity, 0);
  const totalCostBought = materialBatches.reduce((s, b) => s + b.totalPrice, 0);
  const avgCost = totalQtyBought > 0 ? (totalCostBought / totalQtyBought) : 0;

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
               {material.image ? <img src={material.image} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Box size={32}/></div>}
            </div>
            <div className="flex-1 min-w-0">
               <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">{type?.name}</span>
               <h2 className="text-2xl font-bold text-foreground mt-2 break-words leading-tight">{material.name}</h2>
               
               <div className="flex flex-wrap gap-1 mt-3">
                 {material.tagIds.map(tid => {
                   const tag = tags.find(x => x.id === tid);
                   return tag && <span key={tid} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{tag.name}</span>
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
                <p className="text-xl font-bold text-primary">${avgCost.toFixed(2)}</p>
             </div>
          </div>
          {materialBatches.length > 0 && (
            <p className="text-center text-[10px] text-gray-400 mt-2">基於 {materialBatches.length} 筆購入紀錄運算</p>
          )}
        </div>

        {/* Batches Section */}
        <div className="p-4 mt-2">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-lg text-foreground">購入紀錄</h3>
             <button onClick={() => setShowBatchForm(true)} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-transform">
               <Plus size={16}/> 新增購入
             </button>
          </div>

          {/* Filtering */}
          {materialBatches.length > 0 && (
             <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
               <div className="flex items-center text-gray-400 text-xs flex-shrink-0 mr-1"><Filter size={14}/></div>
               <button 
                 onClick={() => setFilterSourceId('')} 
                 className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterSourceId === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}
               >
                 全部管道
               </button>
               {Array.from(new Set(materialBatches.map(b => b.sourceId).filter(Boolean))).map(id => {
                 const source = sources.find(s => s.id === id);
                 if (!source) return null;
                 return (
                   <button 
                     key={source.id} 
                     onClick={() => setFilterSourceId(source.id)} 
                     className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterSourceId === source.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                   >
                     {source.name}
                   </button>
                 )
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
                         <span>{new Date(b.createdAt).toLocaleDateString()}</span>
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
                         <p className="text-[10px] text-gray-400 mb-0.5">單價 (總金額 ${b.totalPrice})</p>
                         <div className="flex items-center justify-end gap-1 text-lg font-bold text-primary">
                           <DollarSign size={16} />
                           {b.unitCost}
                         </div>
                      </div>
                   </div>
                 </div>
               )
            })}
            {filteredBatches.length === 0 && (
               <div className="py-10 text-center text-gray-400 bg-white border border-dashed rounded-2xl">
                 <p>沒有找到相關購入紀錄</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Batch Modal */}
      {showBatchForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">新增購入批次</h3>
                <button onClick={() => setShowBatchForm(false)} className="text-gray-400 bg-gray-100 p-2 rounded-full"><ChevronLeft className="rotate-[-90deg]"/></button>
             </div>
             
             <form onSubmit={handleAddBatch} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground/60 mb-1">購入管道</label>
                  <input 
                    type="text" 
                    required 
                    list="sources-list-detail"
                    value={sourceInput} 
                    onChange={e => setSourceInput(e.target.value)} 
                    className="w-full p-3 rounded-xl border bg-gray-50 text-sm"
                    placeholder="選擇或輸入新管道..."
                  />
                  <datalist id="sources-list-detail">
                    {sources.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-2 items-end">
                   <div>
                     <label className="block text-xs font-medium text-foreground/60 mb-1">購買數量</label>
                     <input 
                       required 
                       type="number" 
                       step={type?.defaultUnit === '顆' ? "1" : "0.01"} 
                       min={type?.defaultUnit === '顆' ? "1" : "0.01"} 
                       value={quantity} 
                       onChange={e => handlePriceChange('qty', e.target.value)} 
                       className="w-full p-2.5 rounded-xl border bg-gray-50 text-sm text-center" 
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-foreground/60 mb-1">購買單價</label>
                     <input 
                       required 
                       type="number" 
                       step="0.01" 
                       value={unitCost} 
                       onChange={e => handlePriceChange('unit', e.target.value)} 
                       className="w-full p-2.5 rounded-xl border bg-gray-50 text-sm text-center" 
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-foreground/60 mb-1">購買總價</label>
                     <input 
                       required
                       type="number" 
                       step="0.1" 
                       value={totalPrice} 
                       onChange={e => handlePriceChange('total', e.target.value)} 
                       className="w-full p-2.5 rounded-xl border bg-gray-50 text-sm text-center" 
                     />
                   </div>
                   <p className="col-span-3 text-[10px] text-gray-400 mt-1">等式：數量 × 單價 = 總價</p>
                </div>
                
                <button type="submit" disabled={!quantity || !unitCost} className="mt-4 w-full bg-primary text-white py-4 rounded-xl font-bold tracking-wider hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50">
                  登錄批次
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
