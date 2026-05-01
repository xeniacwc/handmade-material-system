import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ScrollText, ChevronRight, Plus } from 'lucide-react';
import { btn, tx, layout } from '../../lib/design';

export function RecipeList() {
  const navigate = useNavigate();
  const { recipes, materials, batches } = useStore();

  return (
    <div className="min-h-full">
      {/* ── FIXED PAGE HEADER ── */}
      <header className={layout.pageHeader}>
        <div className={layout.pageHeaderRow}>
          <div>
            <h1 className={tx.pageTitle}>配方管理</h1>
            <p className={tx.meta}>共 {recipes.length} 個配方</p>
          </div>
          <button onClick={() => navigate('/recipes/new')} className={btn.secondary}>
            <Plus size={14} /> 新增配方
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className={`${layout.body} py-4`}>
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-foreground/40 text-center">
            <ScrollText size={56} className="mb-4 stroke-[1.5]" />
            <p className={tx.meta}>尚未建立任何配方</p>
            <button onClick={() => navigate('/recipes/new')} className={`mt-5 ${btn.secondary}`}>
              <Plus size={14} /> 建立第一個配方
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recipes.map((r) => {
              const cost = r.items.reduce((sum, item) => {
                const latest = batches.filter(b => b.materialId === item.materialId).sort((a, b) => b.createdAt - a.createdAt)[0];
                return sum + (latest?.unitCost || 0) * item.quantity;
              }, 0);

              const previewImages = r.items.slice(0, 3)
                .map(i => materials.find(m => m.id === i.materialId)?.image)
                .filter(Boolean);

              return (
                <div key={r.id}
                  className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/90 transition-colors active:scale-[0.99]"
                  onClick={() => navigate(`/recipes/${r.id}`)}
                >
                  <div className="flex -space-x-3 flex-shrink-0">
                    {previewImages.length > 0 ? previewImages.map((img, idx) => (
                      <div key={idx} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden" style={{ zIndex: 3 - idx }}>
                        <img src={img!} alt="" className="w-full h-full object-cover" />
                      </div>
                    )) : (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-400 text-xs">清單</div>
                    )}
                    {r.items.length > 3 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 z-0">+{r.items.length - 3}</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={tx.itemTitle}>{r.name}</h3>
                    <p className={`${tx.caption} mt-0.5`}>{r.items.length} 種材料</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={tx.price}>{Math.round(cost)} 元</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
