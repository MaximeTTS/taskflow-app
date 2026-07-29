'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

/**
 * Inscription.
 *
 * Le compte n'est plus cree ici. La demande est mise en attente et un lien
 * part par email ; le compte nait quand ce lien est ouvert. C'est ce qui
 * ferme l'attaque de pre-inscription : quelqu'un qui s'inscrit avec l'adresse
 * d'un tiers n'obtient rien, puisque seul le destinataire du message decide
 * quel mot de passe entre en vigueur.
 *
 * Il n'y a donc plus de redirection vers le tableau de bord : on annonce
 * l'envoi, et on s'arrete la.
 */
export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

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

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue');
        return;
      }

      setSent(true);
    } catch {
      setError('Le serveur est injoignable. Reessayez dans un instant.');
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
            {sent ? 'Vérifiez votre boîte de réception' : 'Créez votre compte'}
          </p>
        </div>

        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6">
          {sent ? (
            <>
              <p className="text-sm text-[#f0f0ff] mb-3">
                Un lien de confirmation part vers <strong>{email}</strong>.
              </p>
              <p className="text-sm text-[#8888aa] mb-5">
                Votre compte sera créé à l&apos;ouverture de ce lien. Il expire dans 24 heures.
              </p>
              <Link href="/login">
                <Button className="w-full">Aller à la connexion</Button>
              </Link>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                <Input
                  label="Nom"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maxime Dupont"
                />
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
                  hint="10 caractères minimum, et rien de devinable."
                  required
                />
                <Button type="submit" loading={loading} className="w-full mt-2">
                  Créer mon compte
                </Button>
              </form>

              <p className="text-center text-[#55556a] text-sm mt-5">
                Déjà un compte ?{' '}
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
