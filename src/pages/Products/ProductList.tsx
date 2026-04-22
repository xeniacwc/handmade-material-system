import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Package, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '../../components/Toast';

export function ProductList() {
  const navigate = useNavigate();
  const { products, productRecords, recipes, createProductRecord } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreateRecord = (e: React.MouseEvent, productId: string, recipeId: string | null) => {
    e.stopPropagation();
    if (!recipeId) { toast.error('此作品未綁定配方，無法自動記錄製作。'); return; }
    createProductRecord(productId, recipeId);
    toast.success('已新增一筆製作紀錄！');
  };

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      <header className="px-4 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">我的作品</h1>
          <p className="text-sm text-foreground/50 mt-0.5">共 {products.length} 項作品設計</p>
        </div>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform shadow-sm"
        >
          <Plus size={16} /> 新增作品
        </button>
      </header>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-16 text-foreground/40 px-4 text-center">
          <Package size={64} className="mb-4 stroke-[1.5]" />
          <p className="mb-4">尚未記錄任何作品</p>
          <button onClick={() => navigate('/products/new')}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-transform"
          >
            <Plus size={16} /> 建立第一個作品
          </button>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-4">
          {products.map((p) => {
            const records = productRecords.filter(r => r.productId === p.id).sort((a, b) => b.createdAt - a.createdAt);
            const recipe = p.recipeId ? recipes.find(r => r.id === p.recipeId) : null;
            const totalCostSum = records.reduce((sum, r) => sum + r.totalCost, 0);
            const avgCost = records.length > 0 ? Math.round(totalCostSum / records.length) : 0;
            const isExpanded = expandedId === p.id;

            return (
              <div key={p.id} className="glass-card overflow-hidden flex flex-col shadow-md">
                <div
                  className="p-4 flex gap-4 cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-base">{p.name}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{recipe ? `配方：${recipe.name}` : '未綁定配方'}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-xs text-foreground/60">製作 {records.length} 次</span>
                      {records.length > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">均 {avgCost} 元</span>}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-300">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-gray-50/80 border-t p-4 text-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-600 text-xs tracking-wider">歷史製作明細（FIFO 計價）</h4>
                      <button
                        onClick={(e) => handleCreateRecord(e, p.id, p.recipeId)}
                        className="flex items-center gap-1 bg-white border shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-primary active:scale-95 transition-transform"
                      >
                        <Plus size={14} /> 再做一次
                      </button>
                    </div>
                    {records.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">尚無製作紀錄</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                        {records.map((r, i) => (
                          <div key={r.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                            <span className="text-xs text-gray-500">#{records.length - i} · {new Date(r.createdAt).toLocaleDateString('zh-TW')}</span>
                            <span className="font-bold text-primary">{Math.round(r.totalCost)} 元</span>
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
