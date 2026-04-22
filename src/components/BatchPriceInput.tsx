import { useState, useEffect } from 'react';

export interface BatchPriceInputProps {
  initialQuantity?: number;
  initialUnitCost?: number;
  initialTotalPrice?: number;
  defaultUnit?: string;
  onChange: (qty: number, unitCost: number, totalPrice: number) => void;
  // compact mode for shopping list row, regular mode for new batch
  compact?: boolean; 
}

export function BatchPriceInput({ initialQuantity, initialUnitCost, initialTotalPrice, defaultUnit, onChange, compact = false }: BatchPriceInputProps) {
  const [totalPrice, setTotalPrice] = useState<string>(initialTotalPrice ? String(initialTotalPrice) : '');
  const [quantity, setQuantity] = useState<string>(initialQuantity ? String(initialQuantity) : '');
  const [unitCost, setUnitCost] = useState<string>(initialUnitCost ? String(initialUnitCost) : '');

  // Notify parent of numerical changes
  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const u = parseFloat(unitCost) || 0;
    const t = parseFloat(totalPrice) || 0;
    onChange(q, u, t);
  }, [quantity, unitCost, totalPrice]);

  const handlePriceChange = (field: 'total' | 'qty' | 'unit', val: string) => {
    const num = parseFloat(val);
    if (field === 'total') {
      setTotalPrice(val);
      const q = parseFloat(quantity);
      if (q > 0 && !isNaN(num)) setUnitCost(Number(num / q).toFixed(4).replace(/\.?0+$/, ''));
    } else if (field === 'qty') {
      setQuantity(val);
      const t = parseFloat(totalPrice);
      if (t > 0 && num > 0) setUnitCost(Number(t / num).toFixed(4).replace(/\.?0+$/, ''));
    } else if (field === 'unit') {
      setUnitCost(val);
      const q = parseFloat(quantity);
      if (q > 0 && !isNaN(num)) setTotalPrice(Number(num * q).toFixed(2).replace(/\.?0+$/, ''));
    }
  };

  const stepQty = defaultUnit === '顆' ? "1" : "0.01";
  const minQty = defaultUnit === '顆' ? "1" : "0.01";

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">預計購買數量</label>
          <input 
            type="number" step={stepQty} min={minQty}
            value={quantity} onChange={e => handlePriceChange('qty', e.target.value)}
            className="w-full bg-gray-50 border rounded-md px-2 py-1 text-xs text-center" placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">單價預估</label>
          <input 
            type="number" step="any" min="0" 
            value={unitCost} onChange={e => handlePriceChange('unit', e.target.value)}
            className="w-full bg-gray-50 border rounded-md px-2 py-1 text-xs text-center" placeholder="$0.00"
          />
        </div>
        <div>
          <label className="text-[10px] text-primary/70 font-bold mb-0.5 block">預估總價</label>
          <input 
            type="number" step="any" min="0" 
            value={totalPrice} onChange={e => handlePriceChange('total', e.target.value)}
            className="w-full bg-primary/5 border border-primary/20 rounded-md px-2 py-1 text-xs text-center font-bold text-primary" placeholder="$0.00"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-foreground/60 mb-1">購買數量</label>
        <input 
          required 
          type="number" step={stepQty} min={minQty}
          value={quantity} onChange={e => handlePriceChange('qty', e.target.value)}
          className="w-full p-2.5 rounded-xl border bg-gray-50 text-sm text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground/60 mb-1">購買單價</label>
        <input 
          required 
          type="number" step="any" min="0"
          value={unitCost} onChange={e => handlePriceChange('unit', e.target.value)}
          className="w-full p-2.5 rounded-xl border bg-gray-50 text-sm text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground/60 mb-1">購買總價</label>
        <input 
          required
          type="number" step="any" min="0"
          value={totalPrice} onChange={e => handlePriceChange('total', e.target.value)}
          className="w-full p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-sm text-center font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
        />
      </div>
      <p className="col-span-3 text-[10px] text-gray-400 mt-1">等式：數量 × 單價 = 總價 (輸入任兩項自動計算第三項)</p>
    </div>
  );
}
