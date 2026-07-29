'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/ui/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordField, passwordAcceptable } from '@/components/ui/PasswordField';
import { Alert } from '@/components/ui/Alert';
import { AuthAside } from '@/components/ui/AuthAside';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState('');

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

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue');
        return;
      }

      // Aucune redirection vers le tableau de bord : l'inscription ne connecte
      // plus. Le compte n'est utilisable qu'une fois l'adresse confirmée, ce
      // qui empêche de s'inscrire avec l'adresse de quelqu'un d'autre.
      setEnvoye(data.message ?? '');
    } catch {
      setError('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  };

  if (envoye) {
    return (
      <AuthShell
        title="Vérifiez votre boîte mail"
        subtitle="Une dernière étape avant de commencer."
        altPrompt="Déjà confirmé ?"
        altLabel="Se connecter"
        altHref="/login"
        aside={<AuthAside />}
      >
        <div className="flex flex-col gap-5">
          <Alert tone="success">{envoye}</Alert>
          <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Le lien expire dans 24 heures. S’il n’arrive pas, pensez à regarder dans les
            indésirables — vous pourrez aussi en redemander un depuis la page de connexion.
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg" block>
              Aller à la connexion
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

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

        <PasswordField
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          placeholder="••••••••••"
          context={{ email, name }}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!passwordAcceptable(password, { email, name })}
          block
          className="mt-1"
        >
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  );
}
