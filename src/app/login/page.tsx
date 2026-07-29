'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

type User = { id: string; email: string; name: string | null; avatar?: string | null };

/**
 * Connexion.
 *
 * La mutation GraphQL `login` n'existe plus : elle renvoyait un jeton que le
 * client stockait, donc lisible par n'importe quel script de la page. La
 * route REST pose desormais deux cookies `httpOnly` et ne renvoie que
 * l'identite affichable.
 */
export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as {
        user?: User;
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        // Une adresse non confirmee n'est pas une erreur de saisie : on
        // propose le geste utile plutot que de renvoyer au formulaire.
        if (data.code === 'EMAIL_NOT_VERIFIED') setNeedsVerification(true);
        setError(data.error ?? 'Email ou mot de passe incorrect');
        return;
      }

      if (data.user) setUser(data.user);
      router.push('/dashboard');
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
          <p className="text-sm text-[#8888aa]">Connectez-vous à votre compte</p>
        </div>

        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
                {needsVerification && (
                  <Link
                    href="/verifier-email"
                    className="text-indigo-400 hover:text-indigo-300 text-sm mt-1 inline-block"
                  >
                    Recevoir un nouveau lien
                  </Link>
                )}
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
            <Button type="submit" loading={loading} className="w-full mt-2">
              Se connecter
            </Button>
          </form>

          <p className="text-center text-[#55556a] text-sm mt-4">
            <Link href="/mot-de-passe-oublie" className="text-indigo-400 hover:text-indigo-300">
              Mot de passe oublié ?
            </Link>
          </p>

          <p className="text-center text-[#55556a] text-sm mt-3">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
