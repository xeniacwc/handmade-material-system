import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { PackageOpen, Upload, Loader2, AlertCircle, ShoppingCart, Search, CheckCircle, X } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from '../../components/Toast';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function MaterialList() {
  const navigate = useNavigate();
  const { materials, batches, types, addMaterials, namingOptions, addShoppingItem } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'wire'|'bead'|'hardware'>('bead');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAttributes, setFilterAttributes] = useState<Record<string, string[]>>({});

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

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
          id: crypto.randomUUID(), name: '待補', image: base64Image,
          typeId: defaultTypeId, tagIds: [], majorCategory: activeTab,
          attributes: {}, notes: '', createdAt: now + i,
        });
      }
      if (newMaterials.length > 0) addMaterials(newMaterials as any);
      toast.success(`成功上傳 ${newMaterials.length} 張圖片`);
    } catch (err) {
      console.error('Batch upload error:', err);
      toast.error('批次上傳失敗，請重試。');
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

  const clearFilters = () => setFilterAttributes({});

  const currentTabMaterials = useMemo(() => materials.filter(m => m.majorCategory === activeTab), [materials, activeTab]);

  const filteredMaterials = useMemo(() => {
    return currentTabMaterials.filter(m => {
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      for (const [key, selectedVals] of Object.entries(filterAttributes)) {
        if (selectedVals.length === 0) continue;
        const matVal = m.attributes?.[key];
        if (!matVal) return false;
        if (Array.isArray(matVal)) {
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
      <div className="mb-3">
        <label className="block text-[10px] font-bold text-foreground/40 mb-1.5 uppercase tracking-wider">{title}</label>
        <div className="flex flex-wrap gap-1.5">
          {opts.map(o => {
            const isSelected = (filterAttributes[categoryId] || []).includes(o.value);
            return (
              <button
                key={o.id}
                onClick={() => toggleFilter(categoryId, o.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95",
                  isSelected ? "bg-black text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {o.value}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const activeFilterCount = Object.values(filterAttributes).flat().length;

  const handleBatchAddToRestock = () => {
    selectedMaterialIds.forEach(id => {
      addShoppingItem({ id: crypto.randomUUID(), materialId: id, sourceId: null, quantity: 1, unitCost: 0, createdAt: Date.now() });
    });
    toast.success(`已將 ${selectedMaterialIds.length} 項材料加入進貨清單`);
    setIsSelectionMode(false);
    setSelectedMaterialIds([]);
    navigate('/shopping-list');
  };

  // Determine which filter groups to show
  const beadFilterGroups = [
    { title: '材質', id: 'bead_material' }, { title: '形狀', id: 'bead_shape' },
    { title: '顏色', id: 'bead_color' }, { title: '表面處理', id: 'bead_surface' },
    { title: '尺寸', id: 'bead_size' },
  ];
  const wireFilterGroups = [{ title: '材料', id: 'wire_material' }, { title: '直徑', id: 'wire_diameter' }];
  const hardwareFilterGroups = [
    { title: '種類', id: 'hardware_material' }, { title: '顏色', id: 'hardware_color' },
    { title: '尺寸', id: 'hardware_size' },
  ];
  const filterGroups = activeTab === 'bead' ? beadFilterGroups : activeTab === 'wire' ? wireFilterGroups : hardwareFilterGroups;
  const hasFilterOptions = filterGroups.some(g => namingOptions.some(o => o.category === g.id));

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b px-4 pt-safe shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between py-3 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">材料庫</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedMaterialIds([]); }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-colors",
                isSelectionMode ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              <CheckCircle size={14} />
              {isSelectionMode ? '取消' : '批次選取'}
            </button>
            <button onClick={() => navigate('/shopping-list')} className="text-foreground p-2">
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
        <div className="flex gap-6 border-b border-gray-100 max-w-5xl mx-auto">
          {[{ id: 'bead', label: '串珠' }, { id: 'wire', label: '線材' }, { id: 'hardware', label: '五金' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setFilterAttributes({}); }}
              className={cn("pb-3 text-sm font-bold transition-colors relative", activeTab === tab.id ? "text-black" : "text-gray-400")}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-t-sm" />}
            </button>
          ))}
        </div>

        {/* Always-on Filters */}
        {hasFilterOptions && (
          <div className="pt-3 pb-2 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">篩選</span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  <X size={12} /> 清除 ({activeFilterCount})
                </button>
              )}
            </div>
            {filterGroups.map(g => renderFilterChips(g.title, g.id))}
          </div>
        )}

        {/* Search */}
        <div className="py-2 max-w-5xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋材料名稱..."
              className="w-full bg-gray-100 rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleBatchUpload} className="hidden" />

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-5xl mx-auto">
          {filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-foreground/40 mt-16">
              <PackageOpen size={48} className="mb-4 stroke-[1.5]" />
              <p className="text-sm">沒有符合條件的材料</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="mt-3 text-xs text-primary underline">清除篩選條件</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredMaterials.map(m => {
                const mBatches = batches.filter(b => b.materialId === m.id).sort((a, b) => b.createdAt - a.createdAt);
                const latestBatch = mBatches[0];
                const tId = m.typeId || types[0]?.id;
                const type = types.find(t => t.id === tId);
                const isSelected = selectedMaterialIds.includes(m.id);

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (isSelectionMode) {
                        setSelectedMaterialIds(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]);
                      } else {
                        navigate(`/materials/${m.id}`);
                      }
                    }}
                    className={cn(
                      "bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all active:scale-95 relative",
                      isSelectionMode && isSelected ? "border-primary ring-2 ring-primary" : "border-gray-100"
                    )}
                  >
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-white/90 backdrop-blur border flex items-center justify-center">
                        {isSelected && <CheckCircle size={16} className="text-primary" />}
                      </div>
                    )}
                    <div className="aspect-square bg-gray-50 relative">
                      {m.image
                        ? <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300">N/A</div>
                      }
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
                          {latestBatch ? `${latestBatch.unitCost} 元/${type?.defaultUnit}` : '尚未進貨'}
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

      {/* Floating Selection Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-4 bg-gray-900 text-white rounded-2xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-5 z-50">
          <span className="text-sm font-bold">已選取 {selectedMaterialIds.length} 項</span>
          <button
            onClick={handleBatchAddToRestock}
            disabled={selectedMaterialIds.length === 0}
            className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-black active:scale-95 transition-transform disabled:opacity-50"
          >
            加入進貨清單
          </button>
        </div>
      )}
    </div>
  );
}
