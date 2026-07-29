'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/ui/AuthShell';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

type Etat =
  | { phase: 'lecture' }
  | { phase: 'sans-jeton' }
  | { phase: 'envoi' }
  | { phase: 'confirme'; changed: boolean; created: boolean; email: string }
  | { phase: 'echec'; message: string };

/**
 * Page d'arrivée du lien de confirmation.
 *
 * Elle ne connecte pas : confirmer une adresse prouve l'accès à la boîte mail,
 * pas la connaissance du mot de passe. Un lien qui traîne dans un historique
 * ou un aperçu de messagerie ne doit pas valoir ticket d'entrée.
 */
export default function VerifierEmailPage() {
  const [etat, setEtat] = useState<Etat>({ phase: 'lecture' });

  // Les navigateurs et les antivirus de messagerie préchargent volontiers les
  // liens. Sans ce garde-fou, React en mode strict déclencherait deux appels,
  // le second échouant sur un jeton déjà consommé — et l'utilisateur verrait
  // « lien invalide » alors que tout s'est bien passé.
  const lance = useRef(false);

  /**
   * Lit le jeton dans l'URL et le soumet.
   *
   * Rassemblé dans une fonction plutôt qu'écrit dans le corps de l'effet :
   * `window` n'existe pas au rendu serveur, la lecture doit donc attendre le
   * montage, et un `setState` posé directement dans un effet déclenche un
   * second rendu en cascade.
   */
  const demarrer = useCallback(async () => {
    // Lu depuis l'URL plutôt qu'avec `useSearchParams`, qui imposerait
    // d'envelopper la page dans une frontière Suspense.
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

    // `react-hooks/set-state-in-effect` désactivé sciemment. La règle vise les
    // états dérivables du rendu ; celui-ci ne l'est pas. Il dépend de
    // `window.location`, qui n'existe pas au rendu serveur : le lire pendant le
    // rendu provoquerait une divergence d'hydratation. Le rendu initial doit
    // donc être l'état d'attente, et la lecture ne peut avoir lieu qu'ici.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void demarrer();
  }, [demarrer]);

  if (etat.phase === 'lecture' || etat.phase === 'envoi') {
    return (
      <AuthShell
        title="Confirmation en cours"
        subtitle="Un instant."
        altPrompt=""
        altLabel="Se connecter"
        altHref="/login"
      >
        <div className="tf-in h-24 animate-pulse rounded-[var(--r-1)]" />
      </AuthShell>
    );
  }

  if (etat.phase === 'confirme') {
    return (
      <AuthShell
        title={
          etat.changed ? 'Adresse modifiée' : etat.created ? 'Compte activé' : 'Adresse confirmée'
        }
        subtitle="Votre compte est prêt."
        altPrompt=""
        altLabel="Se connecter"
        altHref="/login"
      >
        <div className="flex flex-col gap-5">
          <Alert tone="success">
            {etat.changed
              ? `Votre compte utilise désormais ${etat.email}. Par précaution, vos appareils ont été déconnectés.`
              : etat.created
                ? `Votre compte ${etat.email} est créé et activé. Vous pouvez vous connecter.`
                : 'Votre adresse est confirmée. Vous pouvez vous connecter.'}
          </Alert>
          <Link href="/login">
            <Button variant="primary" size="lg" block>
              Se connecter
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  const message =
    etat.phase === 'sans-jeton'
      ? 'Le lien ne contient pas de jeton. Il a peut-être été tronqué par votre messagerie.'
      : etat.message;

  return (
    <AuthShell
      title="Lien invalide"
      subtitle="Ce lien de confirmation n’est plus utilisable."
      altPrompt=""
      altLabel="Se connecter"
      altHref="/login"
    >
      <div className="flex flex-col gap-5">
        <Alert tone="danger">{message}</Alert>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Les liens de confirmation expirent au bout de 24 heures et ne servent qu’une fois.
          Depuis la page de connexion, vous pouvez en demander un nouveau.
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
