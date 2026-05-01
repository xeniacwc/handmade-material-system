import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Package, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '../../components/Toast';
import { btn, tx, layout } from '../../lib/design';

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
    <div className="min-h-full">
      {/* ── FIXED PAGE HEADER ── */}
      <header className={layout.pageHeader}>
        <div className={layout.pageHeaderRow}>
          <div>
            <h1 className={tx.pageTitle}>我的作品</h1>
            <p className={tx.meta}>共 {products.length} 項</p>
          </div>
          <button onClick={() => navigate('/products/new')} className={btn.secondary}>
            <Plus size={14} /> 新增作品
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className={`${layout.body} py-4`}>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-foreground/40 text-center">
            <Package size={56} className="mb-4 stroke-[1.5]" />
            <p className={tx.meta}>尚未記錄任何作品</p>
            <button onClick={() => navigate('/products/new')} className={`mt-5 ${btn.secondary}`}>
              <Plus size={14} /> 建立第一個作品
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map((p) => {
              const records = productRecords.filter(r => r.productId === p.id).sort((a, b) => b.createdAt - a.createdAt);
              const recipe = p.recipeId ? recipes.find(r => r.id === p.recipeId) : null;
              const totalCostSum = records.reduce((sum, r) => sum + r.totalCost, 0);
              const avgCost = records.length > 0 ? Math.round(totalCostSum / records.length) : 0;
              const isExpanded = expandedId === p.id;

              return (
                <div key={p.id} className="glass-card overflow-hidden">
                  <div
                    className="p-4 flex gap-3 cursor-pointer hover:bg-white/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-300" size={20} /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={tx.itemTitle}>{p.name}</h3>
                      <p className={`${tx.caption} mt-0.5`}>{recipe ? `配方：${recipe.name}` : '未綁定配方'}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={tx.meta}>製作 {records.length} 次</span>
                        {records.length > 0 && <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">均 {avgCost} 元</span>}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-300 self-center">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50/80 border-t p-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className={`${tx.label} tracking-wide`}>歷史製作明細（FIFO 計價）</h4>
                        <button onClick={(e) => handleCreateRecord(e, p.id, p.recipeId)}
                          className="flex items-center gap-1 bg-white border shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-primary active:scale-95 transition-transform"
                        >
                          <Plus size={13} /> 再做一次
                        </button>
                      </div>
                      {records.length === 0 ? (
                        <p className={`${tx.caption} py-4 text-center`}>尚無製作紀錄</p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                          {records.map((r, i) => (
                            <div key={r.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100">
                              <span className={tx.caption}>#{records.length - i} · {new Date(r.createdAt).toLocaleDateString('zh-TW')}</span>
                              <span className={tx.price}>{Math.round(r.totalCost)} 元</span>
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
    </div>
  );
}
