import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  if (value) {
    return (
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-border group">
        <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="w-full aspect-square rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex gap-4 text-primary mb-2">
        <Camera size={32} />
        <ImageIcon size={32} />
      </div>
      <p className="text-sm font-medium text-foreground/60">點擊拍照或上傳圖片</p>
    </div>
  );
}
