import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Settings as SettingsIcon, Plus, X } from 'lucide-react';

type OptionCategory = 'material' | 'shape' | 'color';

export function SettingsList() {
  const { namingOptions, addNamingOption, deleteNamingOption } = useStore();

  const renderSection = (title: string, category: OptionCategory) => {
    const options = namingOptions.filter(o => o.category === category);
    const [inputValue, setInputValue] = useState('');

    const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;

      addNamingOption({
        id: crypto.randomUUID(),
        category,
        value: inputValue.trim()
      });
      setInputValue('');
    };

    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border mb-4">
        <h2 className="font-bold text-foreground mb-3">{title}</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {options.length === 0 && <span className="text-sm text-gray-400">目前沒有設定任何選項</span>}
          {options.map((opt) => (
            <div key={opt.id} className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>{opt.value}</span>
              <button 
                onClick={() => deleteNamingOption(opt.id)}
                className="text-primary/60 hover:text-red-500 transition-colors"
                title="刪除此選項"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`新增${title}...`}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-primary text-primary-foreground px-3 py-2 rounded-xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
          >
            <Plus size={18} />
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="p-4 animate-in fade-in duration-300 pb-24">
      <div className="flex items-center gap-2 mb-6 pl-2">
        <SettingsIcon className="text-foreground" size={24} />
        <h1 className="text-2xl font-bold text-foreground">偏好設定</h1>
      </div>

      <div className="mb-6 px-2 text-sm text-gray-500 leading-relaxed">
        在這裡自訂您建立新材料時的名稱組合器選單。設定完成後，在新增材料的頁面便能快速拼接出完整名稱。
      </div>

      {renderSection('材質選項', 'material')}
      {renderSection('形狀選項', 'shape')}
      {renderSection('顏色選項', 'color')}
    </div>
  );
}
