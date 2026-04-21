import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Settings as SettingsIcon, Plus, X, Tag } from 'lucide-react';

export function SettingsList() {
  const { namingOptions, addNamingOption, deleteNamingOption, sources, addSource } = useStore();

  const renderSection = (title: string, category: string, suffix?: string) => {
    const options = namingOptions.filter(o => o.category === category);
    const [inputValue, setInputValue] = useState('');

    const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;
      const finalVal = suffix ? `${inputValue.trim()}${suffix}` : inputValue.trim();

      addNamingOption({
        id: crypto.randomUUID(),
        category,
        value: finalVal
      });
      setInputValue('');
    };

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-3">
        <h3 className="font-bold text-sm text-foreground/80 mb-3">{title}</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {options.length === 0 && <span className="text-xs text-gray-400">尚無選項</span>}
          {options.map((opt) => (
            <div key={opt.id} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all">
              <span>{opt.value}</span>
              <button 
                onClick={() => deleteNamingOption(opt.id)}
                className="text-primary/60 hover:text-red-500 hover:bg-red-50 p-0.5 rounded-full"
                title="刪除此選項"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type={suffix === 'mm' ? 'number' : 'text'}
            step="any"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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
  };

  const renderSources = () => {
    const [inputValue, setInputValue] = useState('');
    const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;
      addSource({ id: crypto.randomUUID(), name: inputValue.trim() });
      setInputValue('');
    };

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-3">
        <h3 className="font-bold text-sm text-foreground/80 mb-3 block">五、購買來源管理</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {sources.length === 0 && <span className="text-xs text-gray-400">尚無選項</span>}
          {sources.map((src) => (
            <div key={src.id} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
              <span>{src.name}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="新增購買來源店名..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <button type="submit" disabled={!inputValue.trim()} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform">
            <Plus size={16} />
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="p-4 animate-in fade-in duration-300 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4 pl-2">
        <SettingsIcon className="text-foreground" size={24} />
        <h1 className="text-2xl font-bold text-foreground">屬性與來源設定</h1>
      </div>

      <div className="mb-4 px-2 text-xs text-gray-500 leading-relaxed">
        由於材料現在分為三大類，請在此個別設定它們的分類選項。請注意，像尺寸這類屬性，我們會自動幫您加上 mm 單位，您只需填寫數字即可。
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-black text-primary mb-2 flex items-center gap-2 px-1"><Tag size={16}/> 一、串珠專用屬性</h2>
          {renderSection('表面與處理 (可複選)', 'bead_surface')}
          {renderSection('珠子尺寸', 'bead_size', 'mm')}
        </section>

        <section>
          <h2 className="text-sm font-black text-primary mb-2 flex items-center gap-2 px-1"><Tag size={16}/> 二、線材專用屬性</h2>
          {renderSection('線材材質', 'wire_material')}
          {renderSection('線材粗細直徑', 'wire_diameter', 'mm')}
        </section>

        <section>
          <h2 className="text-sm font-black text-primary mb-2 flex items-center gap-2 px-1"><Tag size={16}/> 三、五金專用屬性</h2>
          {renderSection('五金材質', 'hardware_material')}
          {renderSection('外觀顏色', 'hardware_color')}
          {renderSection('五金尺寸', 'hardware_size', 'mm')}
        </section>

        <section>
          <h2 className="text-sm font-black text-primary mb-2 flex items-center gap-2 px-1"><Tag size={16}/> 四、通用設定</h2>
          {renderSection('通用材料材質名稱', 'material')}
          {renderSection('通用形狀', 'shape')}
          {renderSection('通用顏色', 'color')}
        </section>
        
        {renderSources()}
      </div>
    </div>
  );
}
