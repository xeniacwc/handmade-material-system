import { useState, useEffect } from 'react';

export interface BatchPriceInputProps {
  initialQuantity?: number;
  initialUnitCost?: number;
  initialTotalPrice?: number;
  defaultUnit?: string;
  onChange: (qty: number, unitCost: number, totalPrice: number) => void;
  compact?: boolean;
}

export function BatchPriceInput({ initialQuantity, initialUnitCost, initialTotalPrice, defaultUnit, onChange, compact = false }: BatchPriceInputProps) {
  const [totalPrice, setTotalPrice] = useState<string>(initialTotalPrice ? String(Math.round(initialTotalPrice)) : '');
  const [quantity, setQuantity] = useState<string>(initialQuantity ? String(initialQuantity) : '');
  const [unitCost, setUnitCost] = useState<string>(initialUnitCost ? String(Math.round(initialUnitCost)) : '');

  useEffect(() => {
    const q = parseInt(quantity) || 0;
    const u = parseInt(unitCost) || 0;
    const t = parseInt(totalPrice) || 0;
    onChange(q, u, t);
  }, [quantity, unitCost, totalPrice]);

  const handleChange = (field: 'total' | 'qty' | 'unit', val: string) => {
    // Only allow integer input
    const intVal = val === '' ? '' : String(Math.floor(Math.abs(parseFloat(val) || 0)));
    const num = parseInt(intVal) || 0;

    if (field === 'total') {
      setTotalPrice(intVal);
      const q = parseInt(quantity) || 0;
      if (q > 0 && num > 0) setUnitCost(String(Math.round(num / q)));
    } else if (field === 'qty') {
      setQuantity(intVal);
      const t = parseInt(totalPrice) || 0;
      if (t > 0 && num > 0) setUnitCost(String(Math.round(t / num)));
      const u = parseInt(unitCost) || 0;
      if (u > 0 && num > 0) setTotalPrice(String(Math.round(u * num)));
    } else if (field === 'unit') {
      setUnitCost(intVal);
      const q = parseInt(quantity) || 0;
      if (q > 0 && num > 0) setTotalPrice(String(Math.round(num * q)));
    }
  };

  const stepQty = defaultUnit === '顆' ? '1' : '1';
  const minQty = '1';

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">數量</label>
          <input
            type="number" inputMode="numeric" step={stepQty} min={minQty}
            value={quantity} onChange={e => handleChange('qty', e.target.value)}
            className="w-full bg-gray-50 border rounded-md px-2 py-1.5 text-xs text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">單價（元）</label>
          <input
            type="number" inputMode="numeric" step="1" min="0"
            value={unitCost} onChange={e => handleChange('unit', e.target.value)}
            className="w-full bg-gray-50 border rounded-md px-2 py-1.5 text-xs text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-primary/70 font-bold mb-0.5 block">總價（元）</label>
          <input
            type="number" inputMode="numeric" step="1" min="0"
            value={totalPrice} onChange={e => handleChange('total', e.target.value)}
            className="w-full bg-primary/5 border border-primary/20 rounded-md px-2 py-1.5 text-xs text-center font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">數量</label>
          <input
            required
            type="number" inputMode="numeric" step={stepQty} min={minQty}
            value={quantity} onChange={e => handleChange('qty', e.target.value)}
            className="w-full p-2.5 rounded-xl border bg-gray-50 text-sm text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">單價（元）</label>
          <input
            required
            type="number" inputMode="numeric" step="1" min="0"
            value={unitCost} onChange={e => handleChange('unit', e.target.value)}
            className="w-full p-2.5 rounded-xl border bg-gray-50 text-sm text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">總價（元）</label>
          <input
            required
            type="number" inputMode="numeric" step="1" min="0"
            value={totalPrice} onChange={e => handleChange('total', e.target.value)}
            className="w-full p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-sm text-center font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>
      <p className="text-[10px] text-gray-400">輸入任兩項，第三項自動計算（單位：元，整數）</p>
    </div>
  );
}
