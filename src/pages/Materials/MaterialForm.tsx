import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ImageUploader } from '../../components/ImageUploader';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function MaterialForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const { types, addMaterial, updateMaterial, materials, namingOptions, addShoppingItem } = useStore();
  
  const location = useLocation();
  const isFromRestock = new URLSearchParams(location.search).get('redirect') === 'restock';

  const existingMaterial = isEditMode ? materials.find(m => m.id === id) : null;

  const [image, setImage] = useState<string | null>(null);
  const [majorCategory, setMajorCategory] = useState<'wire'|'bead'|'hardware'>('bead');
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');

  const getComputedPrefix = (cat: string, attrs: Record<string, any>) => {
    if (cat === 'bead') {
      const mat = attrs['bead_material'];
      const shape = attrs['bead_shape'];
      const color = attrs['bead_color'];
      const arr = Array.isArray(attrs['bead_surface']) ? attrs['bead_surface'] : [];
      const size = attrs['bead_size'];
      return [mat, shape, color, ...arr, size].filter(Boolean).join('');
    } else if (cat === 'wire') {
      const mat = attrs['wire_material'];
      const diam = attrs['wire_diameter'];
      return [mat, diam].filter(Boolean).join('');
    } else if (cat === 'hardware') {
      const mat = attrs['hardware_material'];
      const col = attrs['hardware_color'];
      const size = attrs['hardware_size'];
      return [mat, col, size].filter(Boolean).join('');
    }
    return '';
  };

  // Initial load
  useEffect(() => {
    if (isEditMode && existingMaterial) {
      setImage(existingMaterial.image);
      setMajorCategory(existingMaterial.majorCategory);
      setAttributes(existingMaterial.attributes || {});
      setNotes(existingMaterial.notes || '');
      
      const prefix = getComputedPrefix(existingMaterial.majorCategory, existingMaterial.attributes || {});
      const currentName = existingMaterial.name === '待補' ? '' : existingMaterial.name;
      if (currentName.startsWith(prefix)) {
        setCustomName(currentName.substring(prefix.length).trim());
      } else {
        setCustomName(currentName);
      }
    }
  }, [isEditMode, existingMaterial]);

  // Handle single/multi selection logic for chips
  const toggleMultiAttr = (key: string, val: string) => {
    setAttributes(prev => {
      const arr = Array.isArray(prev[key]) ? prev[key] : [];
      if (arr.includes(val)) return { ...prev, [key]: arr.filter((x: string) => x !== val) };
      return { ...prev, [key]: [...arr, val] };
    });
  };

  const setSingleAttr = (key: string, val: string) => {
    setAttributes(prev => {
      if (prev[key] === val) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: val };
    });
  };

  // Chips UI Component Generator
  const renderChips = (title: string, categoryId: string, multi: boolean = false) => {
    const opts = namingOptions.filter(o => o.category === categoryId);
    if (opts.length === 0) return null;

    return (
      <div className="mb-4">
        <label className="block text-sm font-bold text-foreground/70 mb-2">{title}</label>
        <div className="flex flex-wrap gap-2">
          {opts.map(o => {
            const isSelected = multi
              ? (Array.isArray(attributes[categoryId]) && attributes[categoryId].includes(o.value))
              : attributes[categoryId] === o.value;
            
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => multi ? toggleMultiAttr(categoryId, o.value) : setSingleAttr(categoryId, o.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"
                )}
              >
                {o.value}
              </button>
            )
          })}
        </div>
      </div>
    );
  };

  // Computed prefix Name
  const computedPrefix = getComputedPrefix(majorCategory, attributes);

  const finalName = computedPrefix ? `${computedPrefix} ${customName}`.trim() : customName.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalName) return;

    // Use default typeId depending on category (assuming wire="1", bead="2")
    // If not configured, we'll just pick the first available or let it be empty if optional
    const tId = existingMaterial?.typeId || types[0]?.id || '';

    if (isEditMode && id) {
      updateMaterial(id, { 
        name: finalName, 
        image, 
        majorCategory, 
        attributes,
        notes,
        typeId: tId
      });
    } else {
      const matId = crypto.randomUUID();
      addMaterial({
        id: matId,
        name: finalName,
        image,
        majorCategory,
        attributes,
        notes,
        typeId: tId,
        tagIds: [],
        createdAt: Date.now()
      });
      if (isFromRestock) {
        addShoppingItem({ id: crypto.randomUUID(), materialId: matId, sourceId: null, quantity: 1, unitCost: 0, createdAt: Date.now() });
        navigate('/shopping-list', { replace: true });
        return;
      }
    }
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center p-4 pt-safe shrink-0 border-b bg-white sticker-header z-10 glass">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground/70 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1 text-center pr-8">
          {isEditMode ? '編輯材料' : '新增材料'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-safe">
        <form onSubmit={handleSubmit} className="flex flex-col p-4 max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
          
          <ImageUploader value={image} onChange={setImage} />

          <div className="bg-white p-4 rounded-2xl shadow-sm border mb-5 mt-4">
            <h2 className="font-bold text-sm mb-3">材料大類</h2>
            {isEditMode ? (
              <div className="py-2.5 rounded-xl text-center text-sm font-bold bg-gray-100 text-gray-500">
                {majorCategory === 'bead' ? '串珠' : majorCategory === 'wire' ? '線材' : '五金'}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bead', label: '串珠' },
                  { id: 'wire', label: '線材' },
                  { id: 'hardware', label: '五金' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setMajorCategory(cat.id as any);
                      setAttributes({});
                    }}
                    className={cn(
                      "py-2.5 rounded-xl text-center text-sm font-bold transition-colors",
                      majorCategory === cat.id ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col mb-5">
            <h2 className="font-bold text-sm mb-4 pb-2 border-b">屬性設定</h2>
            
            {majorCategory === 'bead' && (
              <>
                {renderChips('材質', 'bead_material')}
                {renderChips('形狀', 'bead_shape')}
                {renderChips('顏色', 'bead_color')}
                {renderChips('表面處理 (可多選)', 'bead_surface', true)}
                {renderChips('尺寸', 'bead_size')}
              </>
            )}
            
            {majorCategory === 'wire' && (
              <>
                {renderChips('材料', 'wire_material')}
                {renderChips('直徑', 'wire_diameter')}
              </>
            )}

            {majorCategory === 'hardware' && (
              <>
                {renderChips('種類', 'hardware_material')}
                {renderChips('顏色', 'hardware_color')}
                {renderChips('尺寸', 'hardware_size')}
              </>
            )}

            <div className="mt-2 text-foreground/80">
               <label className="block text-xs font-bold mb-2">後綴描述文字 (選填)</label>
               <input 
                 type="text" 
                 value={customName} 
                 onChange={e => setCustomName(e.target.value)} 
                 className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:border-primary focus:ring-1 transition-colors text-sm" 
                 placeholder="輸入額外描述，例如批號或特殊來源..."
               />
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 border-dashed text-center mt-5 flex flex-col justify-center min-h-[80px]">
              <span className="text-[10px] text-blue-500 font-bold block mb-1">系統組合名稱預覽</span>
              <span className="font-bold text-foreground text-lg leading-tight break-all">
                {finalName || '請選擇屬性或輸入名稱'}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground/70 mb-2 pl-1">備註 / 額外資訊</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border bg-white focus:border-primary focus:ring-1 text-sm resize-none"
              placeholder="可以在此記錄任何材料相關的重要筆記..."
            />
          </div>

          <button type="submit" disabled={!finalName} className="mt-2 mb-8 bg-black text-white py-4 rounded-xl font-bold text-base tracking-wider hover:opacity-90 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md">
            {isEditMode ? '儲存變更' : '建立材料'}
          </button>
        </form>
      </div>
    </div>
  );
}
