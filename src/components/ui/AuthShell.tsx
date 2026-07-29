import Link from 'next/link';
import { Surface } from './Surface';
import { Mark } from './AppShell';
import { ThemeToggle } from './ThemeToggle';

/**
 * Coquille des pages de connexion et d'inscription.
 *
 * Deux colonnes sur grand écran : le formulaire à gauche, un argument à
 * droite. Le formulaire reste à gauche parce que c'est là que va l'œil en
 * lecture latine — la personne qui arrive ici veut entrer, pas être
 * convaincue.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  altPrompt,
  altLabel,
  altHref,
  aside,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  altPrompt: string;
  altLabel: string;
  altHref: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh px-5 py-6 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark size={30} />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">TaskFlow</span>
        </Link>

        <div className="flex items-center gap-3">
          <p className="flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--text-2)' }}>
            <span className="hidden sm:inline">{altPrompt}</span>
            <Link href={altHref} className="tf-link font-semibold">
              {altLabel}
            </Link>
          </p>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl items-center gap-12 pt-[9vh] lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-20">
        <div className="tf-in">
          <h1 className="tf-display mb-2.5 text-[clamp(1.9rem,5vw,2.5rem)]">{title}</h1>
          <p className="mb-8 text-[15px]" style={{ color: 'var(--text-2)' }}>
            {subtitle}
          </p>

          <Surface radius="xl" lift="md" className="p-7 sm:p-8">
            {children}
          </Surface>
        </div>

        {aside && <div className="hidden lg:block">{aside}</div>}
      </div>
    </div>
  );
}
