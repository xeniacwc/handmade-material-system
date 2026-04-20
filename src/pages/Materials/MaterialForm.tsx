import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

import { ImageUploader } from '../../components/ImageUploader';

export function MaterialForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const { types, tags, sources, addTag, addSource, addMaterial, updateMaterial, addBatch, materials, namingOptions } = useStore();

  const existingMaterial = isEditMode ? materials.find(m => m.id === id) : null;

  const [image, setImage] = useState<string | null>(null);
  const [optMaterial, setOptMaterial] = useState('');
  const [optShape, setOptShape] = useState('');
  const [optColor, setOptColor] = useState('');
  const [customName, setCustomName] = useState('');
  const [typeId, setTypeId] = useState(types[0]?.id || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  
  // First Batch (Only in Create Mode)
  const [sourceInput, setSourceInput] = useState('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>('');

  useEffect(() => {
    if (isEditMode && existingMaterial) {
      setImage(existingMaterial.image);
      setCustomName(existingMaterial.name === '待補' ? '' : existingMaterial.name);
      setTypeId(existingMaterial.typeId);
      setSelectedTags(existingMaterial.tagIds);
    }
  }, [isEditMode, existingMaterial]);

  const materialsOpts = namingOptions.filter(o => o.category === 'material');
  const shapesOpts = namingOptions.filter(o => o.category === 'shape');
  const colorsOpts = namingOptions.filter(o => o.category === 'color');
  
  const computedPrefix = [optMaterial, optShape, optColor].filter(Boolean).join('');
  const finalName = computedPrefix ? `${computedPrefix} ${customName}`.trim() : customName.trim();

  const handlePriceChange = (field: 'total' | 'qty' | 'unit', val: string) => {
    const num = parseFloat(val);
    if (field === 'total') {
      setTotalPrice(val);
      const q = parseFloat(quantity);
      if (q > 0 && !isNaN(num)) setUnitCost((num / q).toFixed(2));
    } else if (field === 'qty') {
      setQuantity(val);
      const t = parseFloat(totalPrice);
      if (t > 0 && num > 0) setUnitCost((t / num).toFixed(2));
    } else if (field === 'unit') {
      setUnitCost(val);
      const q = parseFloat(quantity);
      if (q > 0 && !isNaN(num)) setTotalPrice((num * q).toFixed(2));
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const inputNames = newTagInput.split(/[,， ]+/).filter(Boolean);
    
    let newSelected = [...selectedTags];
    
    inputNames.forEach(tagName => {
       let existing = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
       if (!existing) {
         existing = { id: crypto.randomUUID(), name: tagName };
         addTag(existing);
       }
       if (!newSelected.includes(existing.id)) {
         newSelected.push(existing.id);
       }
    });
    
    setSelectedTags(newSelected);
    setNewTagInput('');
  };

  const toggleTag = (tid: string) => {
    if (selectedTags.includes(tid)) {
      setSelectedTags(selectedTags.filter(id => id !== tid));
    } else {
      setSelectedTags([...selectedTags, tid]);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalName || (!typeId && types.length === 0)) return;

    if (isEditMode && id) {
      updateMaterial(id, { name: finalName, image, typeId, tagIds: selectedTags });
    } else {
      const matId = crypto.randomUUID();
      addMaterial({
        id: matId, name: finalName, image, typeId, tagIds: selectedTags, createdAt: Date.now()
      });

      // Add the first batch if quantity is given
      const p = parseFloat(totalPrice);
      const q = parseFloat(quantity);
      const u = parseFloat(unitCost);
      
      let finalSourceId = null;
      if (sourceInput.trim()) {
        let existing = sources.find(s => s.name === sourceInput.trim());
        if (existing) {
          finalSourceId = existing.id;
        } else {
          const newId = crypto.randomUUID();
          addSource({ id: newId, name: sourceInput.trim() });
          finalSourceId = newId;
        }
      }

      if (q > 0 && u >= 0) {
        addBatch({
          id: crypto.randomUUID(),
          materialId: matId,
          sourceId: finalSourceId,
          totalPrice: p || (u * q),
          quantity: q,
          remaining: q,
          unitCost: u,
          createdAt: Date.now()
        });
      }
    }
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground/70"><ChevronLeft size={24} /></button>
        <h1 className="text-lg font-bold">{isEditMode ? '編輯材料' : '建立材料與首批購入'}</h1>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-6">
        <ImageUploader value={image} onChange={setImage} />

        <div className="flex flex-col gap-4">
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
            <label className="block text-sm font-bold text-foreground/80">名稱組合器</label>
            
            <div className="grid grid-cols-3 gap-2">
              <select value={optMaterial} onChange={e => setOptMaterial(e.target.value)} className="w-full p-2.5 rounded-xl border bg-white focus:border-primary focus:ring-1 text-sm">
                <option value="">選擇材質...</option>
                {materialsOpts.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
              <select value={optShape} onChange={e => setOptShape(e.target.value)} className="w-full p-2.5 rounded-xl border bg-white focus:border-primary focus:ring-1 text-sm">
                <option value="">選擇形狀...</option>
                {shapesOpts.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
              <select value={optColor} onChange={e => setOptColor(e.target.value)} className="w-full p-2.5 rounded-xl border bg-white focus:border-primary focus:ring-1 text-sm">
                <option value="">選擇顏色...</option>
                {colorsOpts.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </div>

            <div>
               <label className="block text-xs font-medium text-foreground/50 mb-1">自訂名稱或附加後綴 *</label>
               <input 
                 type="text" 
                 required={!computedPrefix} 
                 value={customName} 
                 onChange={e => setCustomName(e.target.value)} 
                 className="w-full p-3 rounded-xl border bg-white focus:border-primary focus:ring-1" 
                 placeholder={computedPrefix ? "選填描述..." : "輸入材料名稱..."}
               />
            </div>
            
            {(computedPrefix || customName) && (
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-center">
                <span className="text-xs text-primary font-medium block mb-1">最終名稱預覽</span>
                <span className="font-bold text-foreground text-lg">{finalName}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">材料種類</label>
            <select value={typeId} onChange={e => setTypeId(e.target.value)} className="w-full p-3 rounded-xl border bg-white text-sm">
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">標籤分類</label>
            
            <div className="flex items-center flex-wrap gap-2 p-3 bg-white rounded-xl border shadow-sm mb-3">
               {selectedTags.length === 0 && !newTagInput && <span className="text-gray-400 text-sm">輸入標籤後按 Enter 加入</span>}
               {selectedTags.map(tid => {
                  const t = tags.find(x => x.id === tid);
                  return t && (
                    <span key={t.id} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      #{t.name}
                      <button type="button" onClick={() => toggleTag(t.id)} className="hover:text-primary/70"><X size={14}/></button>
                    </span>
                  )
               })}
               <input 
                 type="text" 
                 value={newTagInput} 
                 onChange={e => setNewTagInput(e.target.value)} 
                 onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} 
                 placeholder={selectedTags.length > 0 ? "新增..." : "輸入並按 Enter"} 
                 className="flex-1 min-w-[100px] outline-none text-sm bg-transparent" 
               />
               {newTagInput && <button type="button" onClick={handleAddTag} className="text-primary text-sm font-bold ml-auto">加入</button>}
            </div>

            {/* Quick unselected pool */}
            {tags.filter(t => !selectedTags.includes(t.id)).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                 {tags.filter(t => !selectedTags.includes(t.id)).map(t => (
                   <button 
                     type="button" 
                     key={t.id} 
                     onClick={() => toggleTag(t.id)} 
                     className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs hover:bg-gray-200 transition-colors"
                   >
                     + #{t.name}
                   </button>
                 ))}
              </div>
            )}
          </div>
        </div>

        {!isEditMode && (
          <div className="border-t pt-4 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-foreground/70">首次購入批次 (選填)</h3>
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">購入管道</label>
              <input 
                type="text" 
                required={Number(quantity) > 0 || Number(totalPrice) > 0} 
                list="sources-list"
                value={sourceInput} 
                onChange={e => setSourceInput(e.target.value)} 
                className="w-full p-3 rounded-xl border bg-gray-50 text-sm"
                placeholder="選擇或輸入新管道..."
              />
              <datalist id="sources-list">
                {sources.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-3 gap-3 items-end">
               <div>
                 <label className="block text-xs font-medium text-foreground/60 mb-1">購買數量</label>
                 <input 
                   type="number" 
                   step={types.find(t=>t.id===typeId)?.defaultUnit === '顆' ? "1" : "0.01"} 
                   min={types.find(t=>t.id===typeId)?.defaultUnit === '顆' ? "1" : "0"} 
                   value={quantity} 
                   onChange={e => handlePriceChange('qty', e.target.value)} 
                   className="w-full p-2.5 rounded-xl border bg-white text-sm text-center" 
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-foreground/60 mb-1">購買單價</label>
                 <input 
                   required={Number(quantity) > 0 || Number(totalPrice) > 0} 
                   type="number" 
                   step="0.01" 
                   value={unitCost} 
                   onChange={e => handlePriceChange('unit', e.target.value)} 
                   className="w-full p-2.5 rounded-xl border bg-white text-sm text-center" 
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-foreground/60 mb-1">購買總價</label>
                 <input 
                   required={Number(quantity) > 0 || Number(unitCost) > 0} 
                   type="number" 
                   step="0.1" 
                   value={totalPrice} 
                   onChange={e => handlePriceChange('total', e.target.value)} 
                   className="w-full p-2.5 rounded-xl border bg-white text-sm text-center" 
                 />
               </div>
               <p className="col-span-3 text-[10px] text-gray-400 -mt-1">💡 任輸兩項，第三項自動推算 (等式：數量 × 單價 = 總價)</p>
            </div>
          </div>
        )}

        <button type="submit" disabled={!finalName} className="mt-4 mb-8 bg-primary text-primary-foreground py-4 rounded-xl font-bold tracking-wider hover:opacity-90 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md">
          {isEditMode ? '儲存變更' : '建立材料'}
        </button>
      </form>
    </div>
  );
}
