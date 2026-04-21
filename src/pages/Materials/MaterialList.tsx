import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { PackageOpen, Upload, Loader2, AlertCircle, ShoppingCart, Filter, Search } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function MaterialList() {
  const navigate = useNavigate();
  const { materials, batches, types, addMaterials, namingOptions } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'wire'|'bead'|'hardware'>('bead');
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAttributes, setFilterAttributes] = useState<Record<string, string[]>>({});

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
        const base64Image = await compressImage(file, 800, 800, 0.7);
        newMaterials.push({
          id: crypto.randomUUID(),
          name: '待補',
          image: base64Image,
          typeId: defaultTypeId,
          tagIds: [],
          majorCategory: activeTab, // Assign to current tab
          attributes: {},
          notes: '',
          createdAt: now + i,
        });
      }

      if (newMaterials.length > 0) {
        addMaterials(newMaterials as any);
      }
    } catch (err) {
      console.error('Batch upload error:', err);
      alert('批次上傳失敗，請重試。');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleFilter = (key: string, val: string) => {
    setFilterAttributes(prev => {
      const arr = prev[key] || [];
      if (arr.includes(val)) return { ...prev, [key]: arr.filter(x => x !== val) };
      return { ...prev, [key]: [...arr, val] };
    });
  };

  const currentTabMaterials = useMemo(() => materials.filter(m => m.majorCategory === activeTab), [materials, activeTab]);

  const filteredMaterials = useMemo(() => {
    return currentTabMaterials.filter(m => {
      if (searchQuery && !m.name.includes(searchQuery)) return false;

      // Ensure that for every filter key that has selections, the material matches AT LEAST ONE
      for (const [key, selectedVals] of Object.entries(filterAttributes)) {
        if (selectedVals.length === 0) continue;
        const matVal = m.attributes?.[key];
        // If material doesn't have the attribute, or it's not in the selected array (considering arrays like bead_surface too)
        if (!matVal) return false;
        
        if (Array.isArray(matVal)) {
           // Array intersection exists?
           if (!matVal.some(v => selectedVals.includes(v))) return false;
        } else {
           if (!selectedVals.includes(matVal)) return false;
        }
      }
      return true;
    });
  }, [currentTabMaterials, searchQuery, filterAttributes]);

  const renderFilterChips = (title: string, categoryId: string) => {
    const opts = namingOptions.filter(o => o.category === categoryId);
    if (opts.length === 0) return null;
    
    return (
      <div className="mb-4">
        <label className="block text-xs font-bold text-foreground/50 mb-2 uppercase tracking-wider">{title}</label>
        <div className="flex flex-wrap gap-2">
          {opts.map(o => {
            const isSelected = (filterAttributes[categoryId] || []).includes(o.value);
            return (
              <button
                key={o.id}
                onClick={() => toggleFilter(categoryId, o.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                  isSelected ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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

  const activeFilterCount = Object.values(filterAttributes).flat().length;

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-4 pt-safe shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold text-foreground">材料庫</h1>
          <div className="flex items-center gap-3">
             <button onClick={() => navigate('/shopping-list')} className="text-foreground relative p-2">
               <ShoppingCart size={22} />
             </button>
             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading}
               className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-transform"
             >
               {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
               上傳
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-100 pb-0">
          {[
            { id: 'bead', label: '串珠' },
            { id: 'wire', label: '線材' },
            { id: 'hardware', label: '五金' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setFilterAttributes({}); }}
              className={cn(
                "pb-3 text-sm font-bold transition-colors relative",
                activeTab === tab.id ? "text-black" : "text-gray-400"
              )}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-t-sm" />}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="py-3 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋名稱或備註..." 
              className="w-full bg-gray-100 rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-full flex items-center justify-center transition-colors relative",
              showFilters || activeFilterCount > 0 ? "bg-black text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            <Filter size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleBatchUpload} className="hidden" />

      {/* Expandable Filters */}
      {showFilters && (
        <div className="bg-white border-b px-4 py-4 animate-in slide-in-from-top-2 shadow-sm z-10 relative">
          <div className="flex justify-between items-center mb-4">
             <span className="font-bold text-sm">屬性篩選</span>
             <button onClick={() => setFilterAttributes({})} className="text-xs text-gray-400 underline">清除全部</button>
          </div>
          {activeTab === 'bead' && (
            <>
              {renderFilterChips('材質', 'bead_material')}
              {renderFilterChips('形狀', 'bead_shape')}
              {renderFilterChips('顏色', 'bead_color')}
              {renderFilterChips('表面處理', 'bead_surface')}
              {renderFilterChips('尺寸', 'bead_size')}
            </>
          )}
          {activeTab === 'wire' && (
            <>
              {renderFilterChips('材料', 'wire_material')}
              {renderFilterChips('直徑', 'wire_diameter')}
            </>
          )}
          {activeTab === 'hardware' && (
            <>
              {renderFilterChips('材質', 'hardware_material')}
              {renderFilterChips('顏色', 'hardware_color')}
              {renderFilterChips('尺寸', 'hardware_size')}
            </>
          )}
        </div>
      )}

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMaterials.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-foreground/40 mt-12">
            <PackageOpen size={48} className="mb-4 stroke-[1.5]" />
            <p className="text-sm">沒有符合條件的材料</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMaterials.map((m) => {
              const mBatches = batches.filter(b => b.materialId === m.id).sort((a,b) => b.createdAt - a.createdAt);
              const latestBatch = mBatches[0];
              const tId = m.typeId || types[0]?.id;
              const type = types.find(t => t.id === tId);
              
              return (
                <div key={m.id} onClick={() => navigate(`/materials/${m.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all active:scale-95">
                  <div className="aspect-square bg-gray-50 relative">
                    {m.image ? (
                      <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">N/A</div>
                    )}
                    {m.name === '待補' && (
                      <div className="absolute top-2 right-2 bg-red-500/90 text-white backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold shadow-sm">
                        <AlertCircle size={10} /> 待補
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-xs leading-tight line-clamp-2 min-h-[30px]">{m.name}</h3>
                    <div className="mt-2 flex items-end justify-between">
                       <span className="text-[10px] text-gray-500">{typeof m.attributes === 'object' && Object.keys(m.attributes).length} 屬性</span>
                       <span className="text-[11px] font-bold text-primary">
                         {latestBatch ? `$${latestBatch.unitCost}/${type?.defaultUnit}` : '無庫存'}
                       </span>
                    </div>
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
