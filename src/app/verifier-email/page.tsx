'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type Etat =
  | { phase: 'lecture' }
  | { phase: 'sans-jeton' }
  | { phase: 'envoi' }
  | { phase: 'confirme'; changed: boolean; created: boolean; email: string }
  | { phase: 'echec'; message: string };

/**
 * Page d'arrivee du lien de confirmation.
 *
 * Elle ne connecte pas : confirmer une adresse prouve l'acces a la boite mail,
 * pas la connaissance du mot de passe. Un lien qui traine dans un historique
 * ou un apercu de messagerie ne doit pas valoir ticket d'entree.
 */
export default function VerifierEmailPage() {
  const [etat, setEtat] = useState<Etat>({ phase: 'lecture' });

  // Les navigateurs et les antivirus de messagerie prechargent volontiers les
  // liens. Sans ce garde-fou, React en mode strict declencherait deux appels,
  // le second echouant sur un jeton deja consomme — et l'utilisateur verrait
  // « lien invalide » alors que tout s'est bien passe.
  const lance = useRef(false);

  /**
   * Lit le jeton dans l'URL et le soumet.
   *
   * Rassemble dans une fonction plutot qu'ecrit dans le corps de l'effet :
   * `window` n'existe pas au rendu serveur, la lecture doit donc attendre le
   * montage.
   */
  const demarrer = useCallback(async () => {
    // Lu depuis l'URL plutot qu'avec `useSearchParams`, qui imposerait
    // d'envelopper la page dans une frontiere Suspense.
    const token = new URLSearchParams(window.location.search).get('jeton');

    if (!token) {
      setEtat({ phase: 'sans-jeton' });
      return;
    }

    setEtat({ phase: 'envoi' });
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        changed?: boolean;
        created?: boolean;
        email?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setEtat({ phase: 'echec', message: data.error ?? 'Une erreur est survenue' });
        return;
      }

      setEtat({
        phase: 'confirme',
        changed: Boolean(data.changed),
        created: Boolean(data.created),
        email: data.email ?? '',
      });
    } catch {
      setEtat({ phase: 'echec', message: 'Impossible de joindre le serveur' });
    }
  }, []);

  useEffect(() => {
    if (lance.current) return;
    lance.current = true;

    // `react-hooks/set-state-in-effect` desactive sciemment. La regle vise les
    // etats derivables du rendu ; celui-ci ne l'est pas. Il depend de
    // `window.location`, qui n'existe pas au rendu serveur : le lire pendant le
    // rendu provoquerait une divergence d'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void demarrer();
  }, [demarrer]);

  if (etat.phase === 'lecture' || etat.phase === 'envoi') {
    return (
      <Shell titre="Confirmation en cours">
        <div className="h-20 rounded-lg bg-[#2a2a3a] animate-pulse" />
      </Shell>
    );
  }

  if (etat.phase === 'confirme') {
    return (
      <Shell
        titre={
          etat.changed ? 'Adresse modifiée' : etat.created ? 'Compte activé' : 'Adresse confirmée'
        }
      >
        <p className="text-sm text-[#f0f0ff] mb-5">
          {etat.changed
            ? `Votre compte utilise désormais ${etat.email}. Par précaution, vos appareils ont été déconnectés.`
            : etat.created
              ? `Votre compte ${etat.email} est créé et activé.`
              : 'Votre adresse est confirmée.'}
        </p>
        <Link href="/login">
          <Button className="w-full">Se connecter</Button>
        </Link>
      </Shell>
    );
  }

  const message =
    etat.phase === 'sans-jeton'
      ? 'Le lien ne contient pas de jeton. Il a peut-être été tronqué par votre messagerie.'
      : etat.message;

  return (
    <Shell titre="Lien invalide">
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
        <p className="text-red-400 text-sm">{message}</p>
      </div>
      <p className="text-sm text-[#8888aa] mb-5">
        Les liens de confirmation expirent au bout de 24 heures et ne servent qu&apos;une fois.
      </p>
      <Link href="/login">
        <Button className="w-full">Aller à la connexion</Button>
      </Link>
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
