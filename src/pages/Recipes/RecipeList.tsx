import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ScrollText, ChevronRight, Plus } from 'lucide-react';

export function RecipeList() {
  const navigate = useNavigate();
  const { recipes, materials, batches } = useStore();

  return (
    <div className="p-4 animate-in fade-in duration-300 pb-20">
      <header className="flex items-center justify-between mb-5 pl-1">
        <h1 className="text-2xl font-bold text-foreground">配方管理</h1>
        <button
          onClick={() => navigate('/recipes/new')}
          className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform shadow-sm"
        >
          <Plus size={16} /> 新增配方
        </button>
      </header>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-16 text-foreground/40">
          <ScrollText size={64} className="mb-4 stroke-[1.5]" />
          <p>尚未建立任何配方</p>
          <button onClick={() => navigate('/recipes/new')}
            className="mt-4 flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-transform"
          >
            <Plus size={16} /> 建立第一個配方
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {recipes.map((r) => {
            const cost = r.items.reduce((sum, item) => {
              const materialBatches = batches
                .filter(b => b.materialId === item.materialId)
                .sort((a, b) => b.createdAt - a.createdAt);
              const latestUnitCost = materialBatches[0]?.unitCost || 0;
              return sum + latestUnitCost * item.quantity;
            }, 0);

            const previewImages = r.items
              .slice(0, 3)
              .map(i => materials.find(m => m.id === i.materialId)?.image)
              .filter(Boolean);

            return (
              <div key={r.id} className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/90 transition-colors active:scale-[0.99]"
                onClick={() => navigate(`/recipes/${r.id}`)}
              >
                <div className="flex -space-x-3 flex-shrink-0">
                  {previewImages.length > 0 ? previewImages.map((img, idx) => (
                    <div key={idx} className="w-11 h-11 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm" style={{ zIndex: 3 - idx }}>
                      <img src={img!} alt="" className="w-full h-full object-cover" />
                    </div>
                  )) : (
                    <div className="w-11 h-11 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-400 text-xs">清單</div>
                  )}
                  {r.items.length > 3 && (
                    <div className="w-11 h-11 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 z-0">
                      +{r.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{r.name}</h3>
                  <p className="text-xs text-foreground/60 mt-0.5">{r.items.length} 種材料</p>
                </div>

                <div className="text-right flex items-center gap-1">
                  <p className="font-bold text-primary">{Math.round(cost)} 元</p>
                  <ChevronRight size={15} className="text-gray-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
