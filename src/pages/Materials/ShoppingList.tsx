import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { ShoppingItem } from '../../store/useStore';
import { ChevronLeft, Package, Trash2, CheckCircle, Calculator, Store } from 'lucide-react';

export function ShoppingList() {
  const navigate = useNavigate();
  const { shoppingItems, materials, sources, updateShoppingItem, removeShoppingItem, checkoutShoppingItems } = useStore();

  // Group by sourceId
  const groupedItems = shoppingItems.reduce((acc, item) => {
    const sId = item.sourceId || 'unassigned';
    if (!acc[sId]) acc[sId] = [];
    acc[sId].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  const toggleSourceSelection = (sId: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]
    );
  };

  const handleCheckout = () => {
    // Collect all items from the selected sources
    const itemsToCheckout = selectedSourceIds.flatMap(sId => groupedItems[sId] || []);
    if (itemsToCheckout.length === 0) return;

    // Optional: make sure all items to be checked out have quantity and unitCost > 0
    const invalidItems = itemsToCheckout.filter(i => isNaN(i.quantity) || i.quantity <= 0 || isNaN(i.unitCost));
    if (invalidItems.length > 0) {
      alert('請確認勾選的材料已填妥數量與單價！');
      return;
    }

    if (window.confirm(`確定要將這 ${itemsToCheckout.length} 項材料批次進行入庫嗎？`)) {
      checkoutShoppingItems(itemsToCheckout);
      setSelectedSourceIds([]);
      alert('批次入庫完成！');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b">
        <button onClick={() => navigate('/materials')} className="p-2 -ml-2 text-foreground/70"><ChevronLeft size={24} /></button>
        <h1 className="text-xl font-bold">預備購物清單</h1>
        <div className="w-8"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
        {shoppingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 mt-20">
             <Package size={48} className="mb-4 stroke-[1.5]" />
             <p className="text-sm">您的購物清單空空如也</p>
             <p className="text-xs mt-2">快到材料庫把即將用完的材料加進來吧！</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.keys(groupedItems).map(sId => {
              const sourceName = sId === 'unassigned' ? '未選擇購買來源' : sources.find(s => s.id === sId)?.name || '未知來源';
              const items = groupedItems[sId];
              const isSelected = selectedSourceIds.includes(sId);
              
              let totalEstimate = 0;
              items.forEach(i => {
                if (i.quantity > 0 && i.unitCost > 0) totalEstimate += i.quantity * i.unitCost;
              });

              return (
                <div key={sId} className={`bg-white rounded-2xl border transition-colors ${isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200'}`}>
                  <div 
                    className="flex justify-between items-center p-4 border-b bg-gray-50/50 rounded-t-2xl cursor-pointer"
                    onClick={() => toggleSourceSelection(sId)}
                  >
                     <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                           {isSelected && <CheckCircle size={14} />}
                        </div>
                        <Store size={18} className={isSelected ? 'text-primary' : 'text-gray-500'}/>
                        <span className="font-bold text-[15px]">{sourceName}</span>
                     </div>
                     <span className="text-xs text-gray-500">{items.length} 項</span>
                  </div>

                  <div className="p-4 flex flex-col gap-4">
                    {items.map((item, idx) => {
                      const material = materials.find(m => m.id === item.materialId);
                      if (!material) return null;

                      return (
                        <div key={item.id} className={`flex gap-3 ${idx < items.length - 1 ? 'border-b pb-4' : ''}`}>
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {material.image ? <img src={material.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">無圖</div>}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                               <h4 className="font-bold text-sm leading-tight line-clamp-2">{material.name}</h4>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); removeShoppingItem(item.id); }}
                                 className="text-gray-400 p-1 hover:text-red-500 transition-colors"
                               >
                                 <Trash2 size={16}/>
                               </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="text-[10px] text-gray-500 mb-0.5 block">預計購買數量</label>
                                <input 
                                  type="number" step="any" min="0" 
                                  value={item.quantity || ''}
                                  onChange={e => updateShoppingItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-gray-50 border rounded-md px-2 py-1 text-xs"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 mb-0.5 block">單價預估</label>
                                <input 
                                  type="number" step="any" min="0" 
                                  value={item.unitCost || ''}
                                  onChange={e => updateShoppingItem(item.id, { unitCost: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-gray-50 border rounded-md px-2 py-1 text-xs"
                                  placeholder="$0.00"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-2 text-[10px] text-gray-400 flex items-center justify-between">
                               <span>來源更改：
                                 <select 
                                   value={item.sourceId || ''}
                                   onChange={(e) => updateShoppingItem(item.id, { sourceId: e.target.value || null })}
                                   className="bg-transparent border-b ml-1 outline-none font-bold"
                                 >
                                   <option value="">未指定</option>
                                   {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 </select>
                               </span>
                               {item.quantity > 0 && item.unitCost > 0 && (
                                 <span className="font-bold text-primary">小計: ${(item.quantity * item.unitCost).toFixed(2)}</span>
                               )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {totalEstimate > 0 && (
                    <div className="bg-primary/5 p-3 rounded-b-2xl border-t flex justify-between items-center px-4">
                      <span className="text-xs text-primary font-bold flex items-center gap-1"><Calculator size={14}/> 該來源總預估花費</span>
                      <span className="font-bold text-lg text-primary">${totalEstimate.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedSourceIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-4 bg-gray-900 text-white rounded-2xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-5">
           <span className="text-sm font-bold">已選取 {selectedSourceIds.length} 個來源的紀錄</span>
           <button 
             onClick={handleCheckout} 
             className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-black active:scale-95 transition-transform"
           >
             結帳 / 批次入庫
           </button>
        </div>
      )}
    </div>
  );
}
