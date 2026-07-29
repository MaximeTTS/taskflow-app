'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { checkPassword, PASSWORD_MIN } from '@/lib/password-strength';

/**
 * Choix d'un nouveau mot de passe depuis un lien recu par email.
 *
 * Les regles de robustesse viennent du meme module que celles du serveur : il
 * n'y a pas deux definitions de « mot de passe acceptable » qui pourraient
 * diverger. Le serveur reste seul juge — ce controle sert a ne pas faire
 * decouvrir le refus apres l'envoi du formulaire.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Lu depuis l'URL au montage plutot qu'avec `useSearchParams`, qui
    // imposerait d'envelopper la page dans une frontiere Suspense.
    setToken(new URLSearchParams(window.location.search).get('jeton'));
  }, []);

  const verdict = checkPassword(password);
  const touche = password.length > 0;
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

  // `null` couvre aussi le premier rendu, avant lecture de l'URL : on
  // n'affiche donc rien de definitif tant qu'on ne sait pas.
  if (token === '' || token === null) {
    return (
      <Shell titre="Lien invalide">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
          <p className="text-red-400 text-sm">
            Le lien ne contient pas de jeton. Il a peut-être été tronqué par votre messagerie.
          </p>
        </div>
        <Link href="/mot-de-passe-oublie">
          <Button className="w-full">Demander un nouveau lien</Button>
        </Link>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell titre="Mot de passe modifié">
        <p className="text-sm text-[#f0f0ff] mb-2">
          Votre mot de passe a été modifié.
        </p>
        <p className="text-sm text-[#8888aa] mb-5">
          Tous vos appareils ont été déconnectés.
        </p>
        <Button className="w-full" onClick={() => router.push('/login')}>
          Se connecter
        </Button>
      </Shell>
    );
  }

  return (
    <Shell titre="Nouveau mot de passe">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <Input
          label="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          error={touche && !verdict.ok ? verdict.reason : undefined}
          hint={
            touche && verdict.ok
              ? 'Ce mot de passe convient.'
              : `${PASSWORD_MIN} caractères minimum, et rien de devinable.`
          }
          autoFocus
          required
        />
        <Input
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
          loading={loading}
          disabled={mismatch || !verdict.ok}
          className="w-full mt-2"
        >
          Enregistrer le mot de passe
        </Button>
      </form>
    </Shell>
  );
}

/** Le cadre commun des pages d'authentification, dans l'habillage du site. */
function Shell({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-[#f0f0ff] mb-2">
            Task<span className="text-indigo-400">Flow</span>
          </div>
          <p className="text-sm text-[#8888aa]">{titre}</p>
        </div>
        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6">{children}</div>
      </div>
    </div>
  );
}
