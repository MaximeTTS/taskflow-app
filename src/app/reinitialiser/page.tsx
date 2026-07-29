'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/ui/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordField, passwordAcceptable } from '@/components/ui/PasswordField';
import { Alert } from '@/components/ui/Alert';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Lu depuis l'URL au montage plutôt qu'avec `useSearchParams`, qui
    // imposerait d'envelopper la page dans une frontière Suspense.
    setToken(new URLSearchParams(window.location.search).get('jeton'));
  }, []);

  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue');
        return;
      }

      setDone(true);
    } catch {
      setError('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  };

  if (token === '' || token === null) {
    // `null` couvre aussi le premier rendu, avant lecture de l'URL : on
    // n'affiche donc rien de définitif tant qu'on ne sait pas.
    return (
      <AuthShell
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation est incomplet."
        altPrompt=""
        altLabel="Se connecter"
        altHref="/login"
      >
        <div className="flex flex-col gap-5">
          <Alert tone="danger">
            Le lien ne contient pas de jeton. Il a peut-être été tronqué par votre
            messagerie.
          </Alert>
          <Link href="/mot-de-passe-oublie">
            <Button variant="primary" block>
              Demander un nouveau lien
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={done ? 'Mot de passe modifié' : 'Nouveau mot de passe'}
      subtitle={
        done
          ? 'Vous pouvez maintenant vous connecter.'
          : 'Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.'
      }
      altPrompt="Vous vous en souvenez ?"
      altLabel="Se connecter"
      altHref="/login"
    >
      {done ? (
        <div className="flex flex-col gap-5">
          <Alert tone="success">
            Votre mot de passe a été modifié et tous vos appareils ont été déconnectés.
          </Alert>
          <Button variant="primary" size="lg" block onClick={() => router.push('/login')}>
            Se connecter
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}

          {/* Le contexte du compte (email, nom) n'est pas connu de cette page :
              le lien ne le porte pas, et l'y mettre reviendrait à révéler à qui
              appartient le jeton. Le serveur, lui, applique les deux contrôles. */}
          <PasswordField
            label="Nouveau mot de passe"
            value={password}
            onChange={setPassword}
            autoFocus
            required
          />

          <Field
            label="Confirmation"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            error={mismatch ? 'Ne correspond pas.' : undefined}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={mismatch || !passwordAcceptable(password)}
            block
            className="mt-1"
          >
            Enregistrer le mot de passe
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
