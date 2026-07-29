'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * Demande de reinitialisation.
 *
 * La reponse est la meme que le compte existe ou non : annoncer « adresse
 * inconnue » transformerait ce formulaire en outil d'enumeration des comptes.
 */
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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-[#f0f0ff] mb-2">
            Task<span className="text-indigo-400">Flow</span>
          </div>
          <p className="text-sm text-[#8888aa]">
            {sent ? 'Vérifiez votre boîte de réception' : 'Réinitialiser votre mot de passe'}
          </p>
        </div>

        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6">
          {sent ? (
            <>
              <p className="text-sm text-[#f0f0ff] mb-3">
                Si un compte existe avec cette adresse, un lien vient d&apos;être envoyé.
              </p>
              <p className="text-sm text-[#8888aa] mb-5">
                Il expire dans 30 minutes. Rien reçu ? Vérifiez vos indésirables, puis{' '}
                <button
                  type="button"
                  className="text-indigo-400 hover:text-indigo-300"
                  onClick={() => setSent(false)}
                >
                  réessayez
                </button>
                .
              </p>
              <Link href="/login">
                <Button className="w-full">Retour à la connexion</Button>
              </Link>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                <Input
                  label="Adresse email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
                <Button type="submit" loading={loading} className="w-full mt-2">
                  Envoyer le lien
                </Button>
              </form>

              <p className="text-center text-[#55556a] text-sm mt-5">
                Vous vous en souvenez ?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
