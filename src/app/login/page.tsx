'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/store/auth-store';
import { AuthShell } from '@/components/ui/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { AuthAside } from '@/components/ui/AuthAside';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Vrai quand le compte existe mais que son adresse n'est pas confirmée.
  // Distingué d'une erreur ordinaire parce que la suite à donner est
  // différente : ce n'est pas au mot de passe qu'il faut revenir.
  const [aConfirmer, setAConfirmer] = useState(false);
  const [renvoi, setRenvoi] = useState('');
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);

  const handleRenvoi = async () => {
    setRenvoi('');
    setRenvoiEnCours(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string };
      setRenvoi(data.message ?? 'Si un lien pouvait être envoyé, il l’a été.');
    } catch {
      setRenvoi('Impossible de joindre le serveur');
    } finally {
      setRenvoiEnCours(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAConfirmer(false);
    setRenvoi('');
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

      const data = (await response.json()) as { user?: User; error?: string; code?: string };

      if (!response.ok || !data.user) {
        setError(data.error ?? 'Une erreur est survenue');
        setAConfirmer(data.code === 'EMAIL_NOT_VERIFIED');
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
        {/* Une adresse à confirmer n'est pas une erreur de saisie : le ton
            « info » évite de faire chercher une faute dans le mot de passe. */}
        {error && <Alert tone={aConfirmer ? 'info' : 'danger'}>{error}</Alert>}

        {aConfirmer && !renvoi && (
          <Button variant="ghost" onClick={() => void handleRenvoi()} loading={renvoiEnCours}>
            Renvoyer le lien de confirmation
          </Button>
        )}
        {renvoi && <Alert tone="success">{renvoi}</Alert>}

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
