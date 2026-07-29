'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from './Avatar';
import { IconButton } from './Button';
import { Icon } from './Icon';
import { Surface } from './Surface';

type Page = 'dashboard' | 'profile';

/**
 * Coquille des pages connectées.
 *
 * Une barre unique en haut, flottante. L'ancienne version doublait une
 * barre supérieure et un dock inférieur : deux zones de navigation pour
 * deux destinations, ce qui coûtait de la place sans rien clarifier.
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
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <Surface as="nav" radius="full" panel lift="md" className="mx-auto max-w-7xl">
          <div className="flex h-[58px] items-center gap-3 pl-3 pr-2.5">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
              <Mark />
              <span className="hidden text-[14px] font-semibold tracking-[-0.02em] sm:block">
                TaskFlow
              </span>
            </Link>

            <span className="mx-1 hidden h-5 w-px sm:block" style={{ background: 'var(--rim)' }} />

            <ol className="flex min-w-0 flex-1 items-center gap-1.5 text-[13.5px]">
              {breadcrumb.map((b, i) => {
                const last = i === breadcrumb.length - 1;
                return (
                  <li key={i} className="flex min-w-0 items-center gap-1.5">
                    {i > 0 && (
                      <span style={{ color: 'var(--color-mute)' }} aria-hidden="true">
                        /
                      </span>
                    )}
                    {b.href && !last ? (
                      <Link
                        href={b.href}
                        className="truncate transition-colors hover:text-[color:var(--color-frost)]"
                        style={{ color: 'var(--color-haze)' }}
                      >
                        {b.label}
                      </Link>
                    ) : (
                      <span
                        className="truncate font-medium"
                        aria-current={last ? 'page' : undefined}
                      >
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

            <span className="mx-1 h-5 w-px" style={{ background: 'var(--rim)' }} />

            {user && (
              <Link href="/profile" className="shrink-0" aria-label="Mon profil">
                <Avatar name={user.name ?? user.email} avatar={user.avatar} size={34} online />
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
        </Surface>
      </header>

      {/* Navigation compacte, uniquement sous md. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 md:hidden">
        <Surface radius="full" panel lift="lg">
          <div className="flex h-13 items-center gap-1 px-2 py-2">
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
        </Surface>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-8 pb-28 sm:px-6 md:pb-16">{children}</main>
    </div>
  );
}

/** Marque : trois barres décalées, une par colonne du tableau. */
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[9px]"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(150deg, var(--color-aqua) 0%, #2aa8b8 100%)',
        boxShadow: '0 2px 10px -2px rgba(79,224,213,0.5)',
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2" y="3" width="16" height="2.6" rx="1.3" fill="#04121a" />
        <rect x="2" y="8.7" width="11" height="2.6" rx="1.3" fill="#04121a" opacity="0.75" />
        <rect x="2" y="14.4" width="6.5" height="2.6" rx="1.3" fill="#04121a" opacity="0.5" />
      </svg>
    </span>
  );
}
