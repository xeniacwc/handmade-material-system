import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { PackageOpen } from 'lucide-react';

export function MaterialList() {
  const navigate = useNavigate();
  const { materials, batches, types, tags } = useStore();

  return (
    <div className="p-4 animate-in fade-in duration-300 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-6 pl-2">材料庫</h1>
      
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 text-foreground/40">
          <PackageOpen size={64} className="mb-4 stroke-[1.5]" />
          <p>尚未建立任何材料</p>
          <p className="text-sm mt-1">點擊下方「＋」按鈕新增</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => {
            const mBatches = batches.filter(b => b.materialId === m.id).sort((a,b) => b.createdAt - a.createdAt);
            const latestBatch = mBatches[0];
            const type = types.find(t => t.id === m.typeId);
            
            return (
              <div key={m.id} onClick={() => navigate(`/materials/${m.id}`)} className="glass-card overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow">
                <div className="aspect-square bg-white relative">
                  {m.image ? (
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      N/A
                    </div>
                  )}
                  {m.tagIds.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {m.tagIds.slice(0, 2).map(tid => {
                         const tag = tags.find(x => x.id === tid);
                         return tag && <span key={tid} className="bg-black/50 text-white backdrop-blur-md px-2 py-0.5 rounded-full text-[10px]">#{tag.name}</span>
                      })}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white">
                  <h3 className="font-bold text-sm truncate">{m.name}</h3>
                  <div className="flex justify-between items-end mt-1">
                    <p className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{type?.name}</p>
                    <p className="text-xs text-primary font-medium">
                      {latestBatch ? `$${latestBatch.unitCost} / ${type?.defaultUnit}` : '無庫存'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
