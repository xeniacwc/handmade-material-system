import { Outlet, NavLink } from 'react-router-dom';
import { Package, ScrollText, Scissors, ShoppingCart, WifiOff, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../store/useStore';
import { ToastContainer } from './Toast';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function SyncIndicator() {
  const syncStatus = useStore((s) => s.syncStatus);
  const syncError = useStore((s) => s.syncError);

  if (syncStatus === 'loading') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-foreground/50" title="從 Supabase 載入中...">
        <Loader2 size={13} className="animate-spin text-blue-400" />
        <span className="hidden sm:inline">同步中</span>
      </div>
    );
  }
  if (syncStatus === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400" title={syncError || '同步失敗'}>
        <WifiOff size={13} />
        <span className="hidden sm:inline">離線</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-foreground/40" title="已連接 Supabase">
      <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
      <span className="hidden sm:inline text-green-400/70">已同步</span>
    </div>
  );
}

export function Layout() {
  const navItems = [
    { to: '/', icon: Package, label: '作品' },
    { to: '/recipes', icon: ScrollText, label: '配方' },
    { to: '/materials', icon: Scissors, label: '材料' },
    { to: '/shopping-list', icon: ShoppingCart, label: '進貨清單' },
    { to: '/settings', icon: SettingsIcon, label: '設定' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top status bar */}
      <div className="flex items-center justify-end px-4 pt-safe h-9 shrink-0">
        <SyncIndicator />
      </div>
      <ToastContainer />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation — 5 items, no FAB */}
      <nav className="fixed bottom-0 w-full glass safe-area-pb z-50 border-t border-gray-100">
        <div className="flex justify-around items-center h-14 max-w-2xl mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center flex-1 h-full transition-colors gap-0.5 min-w-0",
                    isActive ? "text-primary" : "text-foreground/45 hover:text-foreground/70"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[9px] font-medium leading-none truncate w-full text-center">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
