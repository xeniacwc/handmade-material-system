import React from 'react';
import { useStore } from '../../store/useStore';
import { ScrollText, ChevronRight } from 'lucide-react';

export function RecipeList() {
  const { recipes, materials } = useStore();

  return (
    <div className="p-4 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-foreground mb-6 pl-2">配方管理</h1>
      
      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 text-foreground/40">
          <ScrollText size={64} className="mb-4 stroke-[1.5]" />
          <p>尚未建立任何配方</p>
          <p className="text-sm mt-1">點擊下方「＋」按鈕新增</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {recipes.map((r) => {
            // Calculate total cost on the fly for display
            const cost = r.items.reduce((sum, item) => {
              const m = materials.find(mat => mat.id === item.materialId);
              return sum + (m?.unitCost || 0) * item.quantity;
            }, 0);

            // Get exactly 3 first material images to show
            const previewImages = r.items
              .slice(0, 3)
              .map(i => materials.find(m => m.id === i.materialId)?.image)
              .filter(Boolean);

            return (
              <div key={r.id} className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/90 transition-colors">
                <div className="flex -space-x-4 flex-shrink-0">
                  {previewImages.length > 0 ? previewImages.map((img, idx) => (
                    <div key={idx} className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm relative z-[3] " style={{ zIndex: 3 - idx }}>
                      <img src={img!} alt="" className="w-full h-full object-cover" />
                    </div>
                  )) : (
                     <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-400 font-medium">清單</div>
                  )}
                  {r.items.length > 3 && (
                    <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 z-0">
                      +{r.items.length - 3}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{r.name}</h3>
                  <p className="text-xs text-foreground/60 mt-1">包含 {r.items.length} 種材料</p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-primary">${cost.toFixed(2)}</p>
                  <ChevronRight size={16} className="text-gray-300 inline-block mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
