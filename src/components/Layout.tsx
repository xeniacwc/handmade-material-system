import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Package, ScrollText, Scissors, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close the add menu when route changes
  React.useEffect(() => {
    setShowAddMenu(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/', icon: Package, label: '作品' },
    { to: '/recipes', icon: ScrollText, label: '配方' },
    { to: '/materials', icon: Scissors, label: '材料' },
  ];

  const handleAdd = (path: string) => {
    navigate(path);
    setShowAddMenu(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 safe-area-pt">
        <Outlet />
      </main>

      {/* Floating Add Menu */}
      {showAddMenu && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setShowAddMenu(false)}>
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd('/materials/new'); }}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg text-foreground font-medium w-40 justify-center transform active:scale-95 transition-transform"
            >
              <Scissors size={20} />
              新增材料
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd('/recipes/new'); }}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg text-foreground font-medium w-40 justify-center transform active:scale-95 transition-transform"
            >
              <ScrollText size={20} />
              新增配方
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd('/products/new'); }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg font-medium w-40 justify-center transform active:scale-95 transition-transform"
            >
              <Package size={20} />
              新增作品
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full glass safe-area-pb z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4 relative">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            // Insert spacing for the center button
            const isRightSide = index >= navItems.length / 2;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center w-16 h-full transition-colors",
                    isActive ? "text-primary" : "text-foreground/50 hover:text-foreground/80",
                    isRightSide && index === 1 ? "ml-8" : "", // Push right items a bit
                    isRightSide && index === 2 ? "ml-4" : "" 
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={24} className={cn("mb-1", isActive && "stroke-[2.5]")} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Center Floating Action Button */}
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="absolute left-1/2 -top-6 -translate-x-1/2 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transform active:scale-95 transition-all z-50"
          >
            <div className={cn("transition-transform duration-300", showAddMenu && "rotate-45")}>
              <Plus size={28} strokeWidth={2.5} />
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
}
