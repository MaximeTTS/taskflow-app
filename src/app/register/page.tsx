'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/store/auth-store';
import { PASSWORD_MIN } from '@/lib/validation';
import { AuthShell } from '@/components/glass/AuthShell';
import { Button } from '@/components/glass/Button';
import { Field } from '@/components/glass/Field';
import { Alert } from '@/components/glass/Alert';
import { AuthAside } from '@/components/glass/AuthAside';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, name }),
      });

      const data = (await response.json()) as { user?: User; error?: string };

      if (!response.ok || !data.user) {
        setError(data.error ?? 'Une erreur est survenue');
        return;
      }

      setUser(data.user);
      router.push('/dashboard');
    } catch {
      setError('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Quelques secondes pour lancer votre premier projet."
      altPrompt="Déjà un compte ?"
      altLabel="Se connecter"
      altHref="/login"
      aside={<AuthAside />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <Field
          label="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maxime Turquet"
          autoComplete="name"
        />

        <Field
          label="Adresse email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          autoComplete="email"
          required
        />

        <Field
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          required
          // L'erreur n'apparaît qu'une fois la saisie commencée : signaler
          // « trop court » sur un champ vide serait un reproche prématuré.
          error={tooShort ? `Encore ${PASSWORD_MIN - password.length} caractère(s).` : undefined}
          hint={`${PASSWORD_MIN} caractères minimum.`}
        />

        <Button type="submit" variant="primary" size="lg" loading={loading} block className="mt-1">
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  );
}
