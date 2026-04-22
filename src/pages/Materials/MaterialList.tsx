import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { PackageOpen, Upload, Loader2, AlertCircle, Search, CheckCircle, X, ChevronDown } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from '../../components/Toast';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Compact horizontal chip row for a single filter category
function FilterRow({ title, categoryId, filterAttributes, toggleFilter, namingOptions }: {
  title: string;
  categoryId: string;
  filterAttributes: Record<string, string[]>;
  toggleFilter: (key: string, val: string) => void;
  namingOptions: { id: string; category: string; value: string }[];
}) {
  const opts = namingOptions.filter(o => o.category === categoryId);
  if (opts.length === 0) return null;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[10px] font-bold text-foreground/35 whitespace-nowrap shrink-0">{title}</span>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {opts.map(o => {
          const isSelected = (filterAttributes[categoryId] || []).includes(o.value);
          return (
            <button
              key={o.id}
              onClick={() => toggleFilter(categoryId, o.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all active:scale-95 shrink-0",
                isSelected ? "bg-black text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {o.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MaterialList() {
  const navigate = useNavigate();
  const { materials, batches, types, sources, addMaterials, namingOptions, addShoppingItem } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'wire'|'bead'|'hardware'>('bead');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterAttributes, setFilterAttributes] = useState<Record<string, string[]>>({});
  const [filterSourceId, setFilterSourceId] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        const base64Image = await compressImage(files[i], 800, 800, 0.7);
        newMaterials.push({ id: crypto.randomUUID(), name: '待補', image: base64Image, typeId: defaultTypeId, tagIds: [], majorCategory: activeTab, attributes: {}, notes: '', createdAt: now + i });
      }
      if (newMaterials.length > 0) addMaterials(newMaterials as any);
      toast.success(`成功上傳 ${newMaterials.length} 張圖片`);
    } catch (err) {
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

  const clearAllFilters = () => { setFilterAttributes({}); setFilterSourceId(''); setSearchQuery(''); };

  const currentTabMaterials = useMemo(() => materials.filter(m => m.majorCategory === activeTab), [materials, activeTab]);

  // Determine which material IDs have been restocked from a given source
  const materialIdsBySource = useMemo(() => {
    if (!filterSourceId) return null;
    const ids = new Set(batches.filter(b => b.sourceId === filterSourceId).map(b => b.materialId));
    return ids;
  }, [batches, filterSourceId]);

  const filteredMaterials = useMemo(() => {
    return currentTabMaterials.filter(m => {
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (materialIdsBySource && !materialIdsBySource.has(m.id)) return false;
      for (const [key, selectedVals] of Object.entries(filterAttributes)) {
        if (selectedVals.length === 0) continue;
        const matVal = m.attributes?.[key];
        if (!matVal) return false;
        if (Array.isArray(matVal)) { if (!matVal.some(v => selectedVals.includes(v))) return false; }
        else { if (!selectedVals.includes(matVal)) return false; }
      }
      return true;
    });
  }, [currentTabMaterials, searchQuery, filterAttributes, materialIdsBySource]);

  const activeFilterCount = Object.values(filterAttributes).flat().length + (filterSourceId ? 1 : 0) + (searchQuery ? 1 : 0);

  const handleBatchAddToRestock = () => {
    selectedMaterialIds.forEach(id => {
      addShoppingItem({ id: crypto.randomUUID(), materialId: id, sourceId: null, quantity: 1, unitCost: 0, createdAt: Date.now() });
    });
    toast.success(`已將 ${selectedMaterialIds.length} 項材料加入進貨清單`);
    setIsSelectionMode(false);
    setSelectedMaterialIds([]);
    navigate('/shopping-list');
  };

  // Primary filter groups (compact, always shown)
  const primaryBeadGroups = [
    { title: '形狀', id: 'bead_shape' },
    { title: '顏色', id: 'bead_color' },
    { title: '表面處理', id: 'bead_surface' },
  ];
  const advancedBeadGroups = [
    { title: '材質', id: 'bead_material' },
    { title: '尺寸', id: 'bead_size' },
  ];
  const wireGroups = [{ title: '材料', id: 'wire_material' }];
  const wireAdvanced = [{ title: '直徑', id: 'wire_diameter' }];
  const hardwareGroups = [{ title: '種類', id: 'hardware_material' }, { title: '顏色', id: 'hardware_color' }];
  const hardwareAdvanced = [{ title: '尺寸', id: 'hardware_size' }];

  const primaryGroups = activeTab === 'bead' ? primaryBeadGroups : activeTab === 'wire' ? wireGroups : hardwareGroups;
  const advancedGroups = activeTab === 'bead' ? advancedBeadGroups : activeTab === 'wire' ? wireAdvanced : hardwareAdvanced;

  // Unique sources that have supplied materials in this tab
  const tabSourceIds = useMemo(() => {
    const ids = new Set(
      batches.filter(b => currentTabMaterials.some(m => m.id === b.materialId) && b.sourceId).map(b => b.sourceId!)
    );
    return Array.from(ids);
  }, [batches, currentTabMaterials]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">材料庫</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedMaterialIds([]); }}
              className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-colors", isSelectionMode ? "bg-primary text-white" : "bg-gray-100 text-gray-600")}
            >
              <CheckCircle size={13} />
              {isSelectionMode ? '取消' : '多選'}
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              className="flex items-center gap-1 bg-black text-white px-2.5 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-transform"
            >
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              上傳
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-100 px-4 max-w-5xl mx-auto">
          {[{ id: 'bead', label: '串珠' }, { id: 'wire', label: '線材' }, { id: 'hardware', label: '五金' }].map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setFilterAttributes({}); setFilterSourceId(''); setShowAdvanced(false); }}
              className={cn("pb-2.5 text-sm font-bold transition-colors relative", activeTab === tab.id ? "text-black" : "text-gray-400")}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-t-sm" />}
            </button>
          ))}
        </div>

        {/* Primary Filters — compact horizontal rows */}
        <div className="px-4 pt-2.5 pb-1.5 max-w-5xl mx-auto space-y-1.5">
          {primaryGroups.map(g => (
            <FilterRow key={g.id} title={g.title} categoryId={g.id} filterAttributes={filterAttributes} toggleFilter={toggleFilter} namingOptions={namingOptions} />
          ))}

          {/* Source filter row */}
          {tabSourceIds.length > 0 && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold text-foreground/35 whitespace-nowrap shrink-0">來源</span>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                {tabSourceIds.map(sid => {
                  const src = sources.find(s => s.id === sid);
                  if (!src) return null;
                  return (
                    <button key={sid}
                      onClick={() => setFilterSourceId(filterSourceId === sid ? '' : sid)}
                      className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0",
                        filterSourceId === sid ? "bg-black text-white" : "bg-gray-100 text-gray-600")}
                    >
                      {src.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advanced toggle + clear */}
          <div className="flex items-center justify-between pt-0.5">
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ChevronDown size={13} className={cn("transition-transform", showAdvanced && "rotate-180")} />
              進階篩選{advancedGroups.some(g => (filterAttributes[g.id] || []).length > 0) ? ' ●' : ''}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSearch(!showSearch)}
                className={cn("flex items-center gap-1 text-[11px] transition-colors", showSearch ? "text-primary font-bold" : "text-gray-400 hover:text-gray-700")}
              >
                <Search size={12} /> 搜尋
              </button>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="flex items-center gap-0.5 text-[11px] text-red-400 hover:text-red-600 transition-colors">
                  <X size={11} /> 清除({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* Advanced filter rows */}
          {showAdvanced && (
            <div className="space-y-1.5 pt-1 border-t border-dashed border-gray-200">
              {advancedGroups.map(g => (
                <FilterRow key={g.id} title={g.title} categoryId={g.id} filterAttributes={filterAttributes} toggleFilter={toggleFilter} namingOptions={namingOptions} />
              ))}
            </div>
          )}

          {/* Search bar (hidden by default) */}
          {showSearch && (
            <div className="relative pt-1">
              <Search className="absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜尋材料名稱..." autoFocus
                className="w-full bg-gray-100 rounded-full py-1.5 pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400">
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="pb-1" />
      </div>

      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleBatchUpload} className="hidden" />

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-3 pb-6">
        <div className="max-w-5xl mx-auto">
          {filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-foreground/40 mt-16">
              <PackageOpen size={48} className="mb-4 stroke-[1.5]" />
              <p className="text-sm">沒有符合條件的材料</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="mt-3 text-xs text-primary underline">清除篩選條件</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredMaterials.map(m => {
                const mBatches = batches.filter(b => b.materialId === m.id).sort((a, b) => b.createdAt - a.createdAt);
                const latestBatch = mBatches[0];
                const tId = m.typeId || types[0]?.id;
                const type = types.find(t => t.id === tId);
                const isSelected = selectedMaterialIds.includes(m.id);

                return (
                  <div key={m.id}
                    onClick={() => {
                      if (isSelectionMode) setSelectedMaterialIds(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]);
                      else navigate(`/materials/${m.id}`);
                    }}
                    className={cn(
                      "bg-white rounded-xl border overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all active:scale-95 relative",
                      isSelectionMode && isSelected ? "border-primary ring-2 ring-primary" : "border-gray-100"
                    )}
                  >
                    {isSelectionMode && (
                      <div className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-white/90 backdrop-blur border flex items-center justify-center">
                        {isSelected && <CheckCircle size={14} className="text-primary" />}
                      </div>
                    )}
                    <div className="aspect-square bg-gray-50 relative">
                      {m.image
                        ? <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">N/A</div>
                      }
                      {m.name === '待補' && (
                        <div className="absolute top-1 right-1 bg-red-500/90 text-white px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                          <AlertCircle size={9} /> 待補
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="font-bold text-[11px] leading-tight line-clamp-2">{m.name}</p>
                      <p className="text-[10px] text-primary font-medium mt-0.5">
                        {latestBatch ? `${latestBatch.unitCost}元/${type?.defaultUnit}` : '尚未進貨'}
                      </p>
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
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-3 bg-gray-900 text-white rounded-2xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-5 z-50">
          <span className="text-sm font-bold">已選取 {selectedMaterialIds.length} 項</span>
          <button onClick={handleBatchAddToRestock} disabled={selectedMaterialIds.length === 0}
            className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-black active:scale-95 transition-transform disabled:opacity-50"
          >
            加入進貨清單
          </button>
        </div>
      )}
    </div>
  );
}
