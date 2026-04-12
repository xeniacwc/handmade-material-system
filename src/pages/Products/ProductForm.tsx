import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ImageUploader } from '../../components/ImageUploader';

export function ProductForm() {
  const navigate = useNavigate();
  const { recipes, addProduct, createProductRecord } = useStore();

  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [recipeId, setRecipeId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const productId = crypto.randomUUID();
    
    // Create the Product Template
    addProduct({
      id: productId,
      name,
      image,
      recipeId: recipeId || null,
      createdAt: Date.now(),
    });

    // If recipe is selected, create the first Production Record automatically to deduct stock and freeze cost
    if (recipeId) {
      createProductRecord(productId, recipeId);
    }

    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground/70"><ChevronLeft size={24} /></button>
        <h1 className="text-lg font-bold">新增作品</h1>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-6">
        <ImageUploader value={image} onChange={setImage} />

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">作品名稱 *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl border focus:border-primary focus:ring-1" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">綁定配方 (用於計算成本與扣除庫存)</label>
            <div className="relative">
              <select value={recipeId} onChange={e => setRecipeId(e.target.value)} className="w-full p-3 rounded-xl bg-white border outline-none appearance-none">
                <option value="">(不綁定)</option>
                {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown size={20} /></div>
            </div>
            {recipeId && <p className="text-xs text-primary mt-2">儲存時將自動扣除材料庫存，並依據 FIFO 算法產出第一筆成本紀錄。</p>}
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button type="submit" disabled={!name} className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold tracking-wider active:scale-95 transition-transform disabled:opacity-50">
            建立作品
          </button>
        </div>
      </form>
    </div>
  );
}
