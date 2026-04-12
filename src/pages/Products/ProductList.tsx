import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Package, Plus, ChevronDown, ChevronUp } from 'lucide-react';

export function ProductList() {
  const { products, productRecords, recipes, createProductRecord } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreateRecord = (e: React.MouseEvent, productId: string, recipeId: string | null) => {
    e.stopPropagation();
    if (!recipeId) return alert('此作品未綁定配方，無法自動製作紀錄。');
    createProductRecord(productId, recipeId);
  };

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">我的作品</h1>
        <p className="text-sm text-foreground/60 mt-1">累積了 {products.length} 項作品設計</p>
      </header>
      
      {products.length === 0 ? (
         <div className="flex flex-col items-center justify-center pt-20 text-foreground/40 px-4 text-center">
         <Package size={64} className="mb-4 stroke-[1.5]" />
         <p>尚未紀錄任何作品</p>
       </div>
      ) : (
        <div className="px-4 flex flex-col gap-6">
          {products.map((p) => {
            const records = productRecords.filter(r => r.productId === p.id).sort((a,b) => b.createdAt - a.createdAt);
            const recipe = p.recipeId ? recipes.find(r => r.id === p.recipeId) : null;
            
            const totalCostSum = records.reduce((sum, r) => sum + r.totalCost, 0);
            const avgCost = records.length > 0 ? (totalCostSum / records.length) : 0;
            
            const isExpanded = expandedId === p.id;

            return (
              <div key={p.id} className="glass-card overflow-hidden flex flex-col shadow-md">
                <div 
                  className="p-4 flex gap-4 cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                     {p.image ? <img src={p.image} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-300"/></div>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <h3 className="font-bold text-lg">{p.name}</h3>
                     <p className="text-[10px] text-gray-500">{recipe ? `配方: ${recipe.name}` : '無配方'}</p>
                     <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground/80">總製作次數: {records.length}</span>
                        {records.length > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">Avg: ${avgCost.toFixed(2)}</span>}
                     </div>
                  </div>
                  <div className="flex items-center text-gray-300">
                     {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-gray-50/80 border-t p-4 text-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-600 text-xs tracking-wider">歷史製作明細 (依 FIFO 計價)</h4>
                      <button 
                        onClick={(e) => handleCreateRecord(e, p.id, p.recipeId)}
                        className="flex items-center gap-1 bg-white border shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-primary active:scale-95 transition-transform"
                      >
                        <Plus size={14}/> 再做一次
                      </button>
                    </div>
                    
                    {records.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">尚無製作紀錄</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                        {records.map((r, i) => (
                          <div key={r.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                            <span className="text-xs text-gray-500">#{records.length - i} &middot; {new Date(r.createdAt).toLocaleDateString()}</span>
                            <span className="font-bold text-primary">${r.totalCost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
