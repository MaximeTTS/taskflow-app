'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { TfBackground } from './Backgrounds';
import { BrandMark, ThemeToggle, IconButton, TfAvatar, Icon } from './atoms';

type ActivePage = 'dashboard' | 'profile';

type Props = {
  breadcrumb: string[];
  active: ActivePage;
  children: React.ReactNode;
};

export function AppShell({ breadcrumb, active, children }: Props) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const navItems: { id: ActivePage; label: string; icon: React.ReactNode; path: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icon.Dashboard />, path: '/dashboard' },
    { id: 'profile', label: 'Profil', icon: <Icon.User />, path: '/profile' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ color: 'var(--tf-text)' }}>
      <TfBackground />

      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-3 sm:px-6 pt-4">
        <div className="tf-pill flex items-center gap-3 rounded-full pl-2 pr-4 h-[52px]">
          <BrandMark size={36} />
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--tf-text-faint)' }}>
              TaskFlow
            </span>
            <span className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ letterSpacing: '-0.01em' }}>
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span style={{ color: 'var(--tf-text-faint)' }}>›</span>}
                  <span style={{ color: i === breadcrumb.length - 1 ? 'var(--tf-text)' : 'var(--tf-text-muted)' }}>
                    {b}
                  </span>
                </span>
              ))}
            </span>
          </div>
        </div>

        <div className="tf-pill flex items-center gap-1 rounded-full px-1.5 h-[52px]">
          <ThemeToggle />
          {user && <div className="ml-1"><TfAvatar name={user.name ?? user.email} avatar={user.avatar} size={36} ring online /></div>}
        </div>
      </div>

      {/* Content */}
      <main className="relative z-[2] px-4 sm:px-6 lg:px-8 pt-6 pb-32 max-w-7xl mx-auto">{children}</main>

      {/* Bottom dock */}
      <div className="fixed bottom-5 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
        <div className="tf-pill flex items-center gap-1.5 rounded-full px-2 h-14 pointer-events-auto">
          {navItems.map((it) => {
            const isActive = it.id === active;
            return (
              <motion.button
                key={it.id}
                onClick={() => router.push(it.path)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className="relative h-10 px-4 rounded-full inline-flex items-center gap-2 text-[13px] font-semibold"
                style={{ color: isActive ? 'var(--tf-text)' : 'var(--tf-text-muted)' }}
              >
                {isActive && (
                  <motion.span
                    layoutId="tf-dock-active"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--tf-card-bg)', boxShadow: 'var(--tf-card-shadow)' }}
                  />
                )}
                <span className="relative z-[1] inline-flex items-center gap-2">
                  {it.icon}
                  {it.label}
                </span>
              </motion.button>
            );
          })}
          <span className="h-6 w-px mx-1" style={{ background: 'var(--tf-hairline)' }} />
          <IconButton
            title="Déconnexion"
            onClick={async () => {
              // On attend la révocation serveur avant de naviguer : sinon la
              // session resterait valable après le retour sur /login.
              await logout();
              router.replace('/login');
            }}
          >
            <Icon.Logout />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
