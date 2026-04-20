import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { PackageOpen, Upload, Loader2, AlertCircle } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';

export function MaterialList() {
  const navigate = useNavigate();
  const { materials, batches, types, tags, addMaterials } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newMaterials = [];
      const defaultTypeId = types[0]?.id || '';
      const now = Date.now();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Compressing image before generating Material
        const base64Image = await compressImage(file, 800, 800, 0.7);
        newMaterials.push({
          id: crypto.randomUUID(),
          name: '待補', // Special keyword for To-Be-Filled
          image: base64Image,
          typeId: defaultTypeId,
          tagIds: [],
          createdAt: now + i, // slight offset to maintain order
        });
      }

      if (newMaterials.length > 0) {
        addMaterials(newMaterials);
      }
    } catch (err) {
      console.error('Batch upload error:', err);
      alert('批次上傳失敗，請重試。');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground pl-2">材料庫</h1>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          批次上傳
        </button>
      </div>

      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={handleBatchUpload}
        className="hidden"
      />
      
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 text-foreground/40">
          <PackageOpen size={64} className="mb-4 stroke-[1.5]" />
          <p>尚未建立任何材料</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            選擇多張圖片批次上傳
          </button>
          <p className="text-sm mt-3">或點擊下方「＋」按鈕手動新增</p>
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
                  {m.name === '待補' && (
                    <div className="absolute top-2 right-2 bg-red-500/90 text-white backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold shadow-sm">
                      <AlertCircle size={10} />
                      待補
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
