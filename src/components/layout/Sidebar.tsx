'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from '@/components/ui/Avatar';

// ─── Context to share open/close state between Sidebar and MobileMenuButton ───

type SidebarContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  setOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// ─── Mobile hamburger button — place this inline in your page header ───

export function MobileMenuButton() {
  const { setOpen } = useSidebar();
  return (
    <button
      onClick={() => setOpen(true)}
      className="lg:hidden p-2 -ml-2 text-[#8888aa] hover:text-[#f0f0ff] transition-colors"
      aria-label="Ouvrir le menu"
    >
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}

// ─── Types ───

type NavItem = {
  label: string;
  path?: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'danger';
};

type SidebarProps = {
  navItems: NavItem[];
  children?: React.ReactNode;
};

// ─── Icons ───

export const SidebarIcons = {
  dashboard: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  profile: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  project: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
};

// ─── Sidebar Provider (wraps your page) ───

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
}

// ─── Sidebar Panel ───

export function Sidebar({ navItems, children }: SidebarProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { open, setOpen } = useSidebar();

  const handleNav = (item: NavItem) => {
    setOpen(false);
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Panel */}
      <aside
        className={`
          w-60 bg-[#111118] border-r border-[#2a2a3a] flex flex-col fixed h-full z-50
          transition-transform duration-300 ease-in-out overflow-y-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo + close */}
        <div className="p-6 border-b border-[#2a2a3a] flex items-center justify-between">
          <div className="text-[28px] font-bold text-[#f0f0ff]">
            Task<span className="text-indigo-400">Flow</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-[#8888aa] hover:text-[#f0f0ff] transition-colors"
            aria-label="Fermer le menu"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3">
          <div className="text-[12px] font-medium text-[#55556a] uppercase tracking-wider px-2 mb-3">
            Menu
          </div>
          {navItems.map((item) => {
            const isDanger = item.variant === 'danger';
            const isActive = item.active;
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-md mb-1 transition-colors
                  ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : isDanger
                        ? 'text-[#8888aa] hover:text-red-400 hover:bg-red-500/10'
                        : 'text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1e1e2a]'
                  }
                `}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Extra content (e.g. members list) */}
        {children && <div className="flex-1">{children}</div>}

        {/* User footer */}
        <div className="p-4 border-t border-[#2a2a3a] mt-auto">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user?.name ?? user?.email ?? 'U'} avatar={user?.avatar} size="sm" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#f0f0ff] truncate">
                {user?.name ?? 'Utilisateur'}
              </div>
              <div className="text-xs text-[#8888aa] truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
