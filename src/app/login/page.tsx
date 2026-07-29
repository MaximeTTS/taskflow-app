'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/store/auth-store';
import { AuthShell } from '@/components/glass/AuthShell';
import { Button } from '@/components/glass/Button';
import { Field } from '@/components/glass/Field';
import { Alert } from '@/components/glass/Alert';
import { AuthAside } from '@/components/glass/AuthAside';

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
      // a transmis une. Seuls les chemins internes sont acceptés : une valeur
      // comme `//exemple.com` redirigerait vers un autre site.
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
      altLabel="Créer un compte"
      altHref="/register"
      aside={<AuthAside />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <Field
          label="Adresse email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          autoComplete="email"
          required
        />

        <div>
          <Field
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            autoComplete="current-password"
            required
          />
          <p className="mt-2 text-right">
            <Link href="/mot-de-passe-oublie" className="tf-link text-[13px]">
              Mot de passe oublié ?
            </Link>
          </p>
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading} block className="mt-1">
          Se connecter
        </Button>
      </form>
    </AuthShell>
  );
}
