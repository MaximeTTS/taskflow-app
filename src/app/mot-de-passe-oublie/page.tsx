'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/glass/AuthShell';
import { Button } from '@/components/glass/Button';
import { Field } from '@/components/glass/Field';
import { Alert } from '@/components/glass/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError('Une erreur est survenue');
        return;
      }

      setSent(true);
    } catch {
      setError('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Indiquez votre adresse, nous vous enverrons un lien."
      altPrompt="Vous vous en souvenez ?"
      altLabel="Se connecter"
      altHref="/login"
    >
      {sent ? (
        <div className="flex flex-col gap-5">
          {/* Le message ne confirme pas que le compte existe : le dire ici
              transformerait ce formulaire en outil d'énumération. */}
          <Alert tone="success">
            Si un compte existe avec cette adresse, un lien de réinitialisation vient
            d’être envoyé. Il expire dans 30 minutes.
          </Alert>

          <p className="text-[13.5px]" style={{ color: 'var(--color-haze)' }}>
            Rien reçu ? Vérifiez vos indésirables, puis{' '}
            <button
              type="button"
              className="tf-link font-semibold"
              onClick={() => setSent(false)}
            >
              réessayez
            </button>
            .
          </p>

          <Link href="/login">
            <Button variant="glass" block>
              Retour à la connexion
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}

          <Field
            label="Adresse email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            autoComplete="email"
            autoFocus
            required
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} block className="mt-1">
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
