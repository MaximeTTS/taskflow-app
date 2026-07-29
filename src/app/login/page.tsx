'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/store/auth-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from '@/components/tf/AuthShell';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // La connexion passe par une route REST : elle seule peut poser le
      // cookie httpOnly qui portera la session.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { user?: User; error?: string };

      if (!response.ok || !data.user) {
        setError(data.error ?? 'Une erreur est survenue');
        return;
      }

      setUser(data.user);

      // Retour sur la page demandée avant la redirection, si le middleware en
      // a transmis une. Lu ici plutôt qu'avec `useSearchParams`, qui imposerait
      // d'envelopper la page dans une frontière Suspense.
      // Seuls les chemins internes sont acceptés : une valeur comme
      // `//exemple.com` redirigerait vers un autre site.
      const suivant = new URLSearchParams(window.location.search).get('suivant');
      const destination =
        suivant && suivant.startsWith('/') && !suivant.startsWith('//') ? suivant : '/dashboard';
      router.push(destination);
    } catch {
      setError('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Bon retour"
      subtitle="Reprenez là où vous vous êtes arrêté."
      altPrompt="Pas encore de compte ?"
      altLabel="S'inscrire"
      altHref="/register"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          Se connecter <span>→</span>
        </Button>
      </form>
    </AuthShell>
  );
}
