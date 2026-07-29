'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from './Avatar';
import { IconButton } from './Button';
import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';

type Page = 'dashboard' | 'profile';

/**
 * Coquille des pages connectées.
 *
 * La barre est la seule surface de l'application à rester translucide en
 * permanence : elle flotte au-dessus du contenu qui défile sous elle, et
 * c'est exactement le cas où le verre sert à quelque chose. Partout
 * ailleurs, une surface opaque est plus lisible.
 */
export function AppShell({
  children,
  active,
  breadcrumb,
}: {
  children: React.ReactNode;
  active: Page;
  /** Fil d'Ariane. Le dernier élément est la page courante. */
  breadcrumb: { label: string; href?: string }[];
}) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const nav: { id: Page; label: string; icon: React.ReactNode; href: string }[] = [
    { id: 'dashboard', label: 'Projets', icon: <Icon.Board size={16} />, href: '/dashboard' },
    { id: 'profile', label: 'Profil', icon: <Icon.User size={16} />, href: '/profile' },
  ];

  return (
    <div className="min-h-dvh">
      <header
        className="tf-glass sticky top-0 z-30"
        style={{ borderTop: 0, borderInline: 0, borderBottom: '1px solid var(--border)' }}
      >
        <div className="mx-auto flex h-[56px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <Mark />
            <span className="hidden text-[14px] font-semibold tracking-[-0.02em] sm:block">
              TaskFlow
            </span>
          </Link>

          <span
            className="mx-1 hidden h-5 w-px sm:block"
            style={{ background: 'var(--border-strong)' }}
          />

          <ol className="flex min-w-0 flex-1 items-center gap-1.5 text-[13.5px]">
            {breadcrumb.map((b, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <li key={i} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && (
                    <span style={{ color: 'var(--text-3)' }} aria-hidden="true">
                      /
                    </span>
                  )}
                  {b.href && !last ? (
                    <Link
                      href={b.href}
                      className="truncate transition-colors hover:text-[color:var(--text-1)]"
                      style={{ color: 'var(--text-2)' }}
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span className="truncate font-medium" aria-current={last ? 'page' : undefined}>
                      {b.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((it) => (
              <Link
                key={it.id}
                href={it.href}
                aria-current={it.id === active ? 'page' : undefined}
                className="tf-nav-item"
                data-active={it.id === active ? 'true' : undefined}
              >
                {it.icon}
                {it.label}
              </Link>
            ))}
          </nav>

          <span className="mx-1 h-5 w-px" style={{ background: 'var(--border-strong)' }} />

          <ThemeToggle />

          {user && (
            <Link href="/profile" className="shrink-0" aria-label="Mon profil">
              <Avatar name={user.name ?? user.email} avatar={user.avatar} size={32} online />
            </Link>
          )}

          <IconButton
            label="Se déconnecter"
            onClick={async () => {
              await logout();
              router.replace('/login');
            }}
          >
            <Icon.Logout size={16} />
          </IconButton>
        </div>
      </header>

      {/* Navigation compacte, uniquement sous md. */}
      <nav
        className="tf-glass fixed inset-x-0 bottom-0 z-30 flex justify-center py-2 md:hidden"
        style={{ borderBottom: 0, borderInline: 0, borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-1">
          {nav.map((it) => (
            <Link
              key={it.id}
              href={it.href}
              aria-current={it.id === active ? 'page' : undefined}
              className="tf-nav-item"
              data-active={it.id === active ? 'true' : undefined}
            >
              {it.icon}
              {it.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-8 pb-28 sm:px-6 md:pb-16">{children}</main>
    </div>
  );
}

/** Marque : trois barres décalées, une par colonne du tableau. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--r-1)',
        background: 'linear-gradient(140deg, var(--accent) 0%, var(--accent-2) 100%)',
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2" y="3" width="16" height="2.6" rx="1.3" fill="#fff" />
        <rect x="2" y="8.7" width="11" height="2.6" rx="1.3" fill="#fff" opacity="0.8" />
        <rect x="2" y="14.4" width="6.5" height="2.6" rx="1.3" fill="#fff" opacity="0.55" />
      </svg>
    </span>
  );
}
