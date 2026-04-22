import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { NamingOption, PurchaseSource } from '../../store/useStore';
import { Settings as SettingsIcon, Plus, X, Tag, Pencil, Check } from 'lucide-react';
import { toast } from '../../components/Toast';

/* ── Editable chip for a single naming option ── */
function OptionChip({ opt, onDelete, onUpdate, suffix }: {
  opt: NamingOption;
  suffix?: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  // strip suffix for display in edit mode
  const rawValue = suffix ? opt.value.replace(new RegExp(`${suffix}$`), '') : opt.value;
  const [editVal, setEditVal] = useState(rawValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setEditing(true);
    setEditVal(rawValue);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSave = () => {
    const trimmed = editVal.trim();
    if (!trimmed) { setEditing(false); return; }
    const finalVal = suffix ? `${trimmed}${suffix}` : trimmed;
    if (finalVal !== opt.value) onUpdate(opt.id, finalVal);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 bg-primary/10 border border-primary rounded-full px-2 py-1">
        <input
          ref={inputRef}
          type={suffix === 'mm' ? 'number' : 'text'}
          step="any"
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
          onBlur={handleSave}
          className="bg-transparent text-primary text-xs font-medium w-16 outline-none min-w-0"
        />
        {suffix && <span className="text-primary text-xs">{suffix}</span>}
        <button onClick={handleSave} className="text-primary p-0.5"><Check size={12} /></button>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all">
      <span>{opt.value}</span>
      <button onClick={handleEdit} className="text-primary/60 hover:text-primary p-0.5 rounded-full" title="編輯">
        <Pencil size={11} />
      </button>
      <button onClick={() => onDelete(opt.id)} className="text-primary/60 hover:text-red-500 hover:bg-red-50 p-0.5 rounded-full" title="刪除">
        <X size={12} />
      </button>
    </div>
  );
}

/* ── Sources chip ── */
function SourceChip({ src, onUpdate }: { src: PurchaseSource; onUpdate: (id: string, name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(src.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => { setEditing(true); setEditVal(src.name); setTimeout(() => inputRef.current?.focus(), 50); };
  const handleSave = () => {
    const v = editVal.trim();
    if (v && v !== src.name) onUpdate(src.id, v);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 bg-gray-200 border border-gray-400 rounded-full px-2 py-1">
        <input
          ref={inputRef}
          type="text"
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
          onBlur={handleSave}
          className="bg-transparent text-gray-700 text-xs font-medium w-20 outline-none min-w-0"
        />
        <button onClick={handleSave} className="text-gray-600 p-0.5"><Check size={12} /></button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
      <span>{src.name}</span>
      <button onClick={handleEdit} className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full" title="編輯名稱">
        <Pencil size={11} />
      </button>
    </div>
  );
}

/* ── Attribute section ── */
function AttributeSection({ title, category, suffix }: { title: string; category: string; suffix?: string }) {
  const { namingOptions, addNamingOption, deleteNamingOption, updateNamingOption } = useStore();
  const options = namingOptions.filter(o => o.category === category);
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const finalVal = suffix ? `${inputValue.trim()}${suffix}` : inputValue.trim();
    if (options.some(opt => opt.value === finalVal)) {
      toast.error('此選項已存在！');
      return;
    }
    addNamingOption({ id: crypto.randomUUID(), category, value: finalVal });
    setInputValue('');
    toast.success(`已新增「${finalVal}」`);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-3">
      <h3 className="font-bold text-sm text-foreground/80 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {options.length === 0 && <span className="text-xs text-gray-400">尚無選項</span>}
        {options.map(opt => (
          <OptionChip
            key={opt.id}
            opt={opt}
            suffix={suffix}
            onDelete={deleteNamingOption}
            onUpdate={updateNamingOption}
          />
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type={suffix === 'mm' ? 'number' : 'text'}
          step="any"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={`新增${title}...`}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
        {suffix && <span className="flex items-center text-gray-400 text-sm font-medium mr-1">{suffix}</span>}
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}

/* ── Sources section ── */
function SourcesSection() {
  const { sources, addSource, updateSource } = useStore();
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (sources.some(s => s.name === inputValue.trim())) {
      toast.error('此來源已存在！');
      return;
    }
    addSource({ id: crypto.randomUUID(), name: inputValue.trim() });
    setInputValue('');
    toast.success(`已新增進貨來源「${inputValue.trim()}」`);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-3">
      <h3 className="font-bold text-sm text-foreground/80 mb-3 block">四、進貨來源管理</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {sources.length === 0 && <span className="text-xs text-gray-400">尚無來源</span>}
        {sources.map(src => (
          <SourceChip key={src.id} src={src} onUpdate={updateSource} />
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="新增進貨來源名稱..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-gray-800 text-white px-3 py-1.5 rounded-lg flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}

/* ── Main page ── */
export function SettingsList() {
  return (
    <div className="p-4 animate-in fade-in duration-300 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4 pl-2">
        <SettingsIcon className="text-foreground" size={24} />
        <h1 className="text-2xl font-bold text-foreground">屬性與來源設定</h1>
      </div>

      <div className="mb-4 px-2 text-xs text-gray-500 leading-relaxed">
        在此設定各類材料的屬性選項。尺寸類屬性會自動加上 mm 單位，只需填數字即可。點擊 <Pencil size={11} className="inline" /> 可直接編輯現有選項名稱。
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-black text-primary mb-2 flex items-center gap-2 px-1"><Tag size={16}/> 一、串珠專用屬性</h2>
          <AttributeSection title="材質" category="bead_material" />
          <AttributeSection title="形狀" category="bead_shape" />
          <AttributeSection title="顏色" category="bead_color" />
          <AttributeSection title="表面與處理（可複選）" category="bead_surface" />
          <AttributeSection title="尺寸" category="bead_size" suffix="mm" />
        </section>

        <section>
          <h2 className="text-sm font-black text-primary mb-2 flex items-center gap-2 px-1"><Tag size={16}/> 二、線材專用屬性</h2>
          <AttributeSection title="材料" category="wire_material" />
          <AttributeSection title="直徑" category="wire_diameter" suffix="mm" />
        </section>

        <section>
          <h2 className="text-sm font-black text-primary mb-2 flex items-center gap-2 px-1"><Tag size={16}/> 三、五金專用屬性</h2>
          <AttributeSection title="種類" category="hardware_material" />
          <AttributeSection title="顏色" category="hardware_color" />
          <AttributeSection title="尺寸" category="hardware_size" suffix="mm" />
        </section>

        <SourcesSection />
      </div>
    </div>
  );
}
