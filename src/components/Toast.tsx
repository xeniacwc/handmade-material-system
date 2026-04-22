import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Global toast state — singleton pattern so any component can trigger toasts
type Listener = (toasts: ToastMessage[]) => void;
let _toasts: ToastMessage[] = [];
const _listeners: Set<Listener> = new Set();

function notify() {
  _listeners.forEach(l => l([..._toasts]));
}

export const toast = {
  show(message: string, type: ToastType = 'success', duration = 2500) {
    const id = crypto.randomUUID();
    _toasts = [..._toasts, { id, message, type }];
    notify();
    setTimeout(() => {
      _toasts = _toasts.filter(t => t.id !== id);
      notify();
    }, duration);
  },
  success(message: string) { this.show(message, 'success'); },
  error(message: string) { this.show(message, 'error', 3500); },
  info(message: string) { this.show(message, 'info'); },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => setToasts(t);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none px-4 w-full max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`
            w-full flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium
            animate-in slide-in-from-top-4 fade-in duration-200
            ${t.type === 'success' ? 'bg-gray-900 text-white' : ''}
            ${t.type === 'error' ? 'bg-red-600 text-white' : ''}
            ${t.type === 'info' ? 'bg-blue-600 text-white' : ''}
          `}
        >
          {t.type === 'success' && <CheckCircle size={16} className="shrink-0" />}
          {t.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
          {t.type === 'info' && <AlertCircle size={16} className="shrink-0" />}
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// Hook version if needed
export function useToast() {
  return { toast };
}
