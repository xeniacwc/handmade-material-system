import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Material } from '../../store/useStore';

export function RecipeForm() {
  const navigate = useNavigate();
  const { materials, batches, types, addRecipe } = useStore();

  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ material: Material; quantity: number }[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [materials, search]);

  // Fallback calculation just for UI hint
  const estimateCost = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const mBatches = batches.filter(b => b.materialId === item.material.id).sort((a,b) => b.createdAt - a.createdAt);
      const latestCost = mBatches[0]?.unitCost || 0;
      return sum + (latestCost * item.quantity);
    }, 0);
  }, [selectedItems, batches]);

  const toggleMaterial = (material: Material) => {
    const existing = selectedItems.find(i => i.material.id === material.id);
    if (existing) {
      setSelectedItems(selectedItems.filter(i => i.material.id !== material.id));
    } else {
      setSelectedItems([...selectedItems, { material, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 0) return;
    setSelectedItems(selectedItems.map(i => i.material.id === id ? { ...i, quantity: qty } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedItems.length === 0) return;
    
    addRecipe({
      id: crypto.randomUUID(),
      name,
      items: selectedItems.map(i => ({ materialId: i.material.id, quantity: i.quantity })),
      createdAt: Date.now(),
    });
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground/70"><ChevronLeft size={24} /></button>
        <h1 className="text-lg font-bold">新增配方</h1>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">配方名稱 *</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl border focus:border-primary focus:ring-1" />
        </div>

        <div>
           <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-foreground/70">所需材料 *</label>
            <button type="button" onClick={() => setShowPicker(true)} className="text-primary text-sm font-bold flex items-center gap-1"><Plus size={16} /> 選擇材料</button>
          </div>
          
          <div className="flex flex-col gap-3">
             {selectedItems.length === 0 ? (
              <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-foreground/40 bg-white/50">
                <p>尚未建立材料組合</p>
              </div>
            ) : (
               selectedItems.map((item) => {
                 const type = types.find(t => t.id === item.material.typeId);
                 return (
                  <div key={item.material.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border shadow-sm">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.material.image && <img src={item.material.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.material.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" step="0.1"
                        className="w-16 p-2 text-center bg-gray-50 border rounded-lg text-sm outline-none focus:border-primary"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.material.id, parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-xs text-gray-500 w-4">{type?.defaultUnit}</span>
                      <button type="button" onClick={() => toggleMaterial(item.material)} className="p-1 text-foreground/40 hover:text-destructive"><X size={20} /></button>
                    </div>
                  </div>
                 )
               })
            )}
          </div>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-2">
           {/* Visual tier reduced for cost estimation */}
           {selectedItems.length > 0 && (
             <div className="text-right text-xs text-gray-400 px-2">
               預估粗略成本: ${estimateCost.toFixed(2)} (依最新批次)
             </div>
           )}
          <button type="submit" disabled={!name || selectedItems.length === 0} className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold tracking-wider hover:opacity-90 active:scale-[0.98] transition-transform disabled:opacity-50">
            完成儲存配方
          </button>
        </div>
      </form>

      {/* Material Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b">
            <div className="w-10"></div>
            <h2 className="text-lg font-bold">選擇材料</h2>
            <button onClick={() => setShowPicker(false)} className="p-2 -mr-2 text-foreground/70"><span className="font-bold text-primary">確認</span></button>
          </header>
          <div className="p-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="搜尋材料..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-safe">
            {filteredMaterials.map(m => {
              const isSelected = selectedItems.some(i => i.material.id === m.id);
              const type = types.find(t => t.id === m.typeId);
              return (
                <div key={m.id} onClick={() => toggleMaterial(m)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent bg-white shadow-sm'}`}>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {m.image && <img src={m.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{m.name}</h4>
                    <p className="text-xs text-foreground/60">{type?.name}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
