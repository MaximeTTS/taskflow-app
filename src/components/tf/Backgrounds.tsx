'use client';

import { useSyncExternalStore } from 'react';
import { useTfTheme, TF_BACKGROUNDS } from './theme';

/**
 * Fond du site. Deux modes (choisis dans le panneau Apparence, persistes) :
 *  - mesh : degrade anime en CSS pur, sans aucun telechargement
 *  - video : une video de fond en boucle, muette, plein cadre
 * Les deux se placent derriere le verre, en z-index 0.
 */

/**
 * Faut-il eviter de charger une video ?
 *
 * Trois cas : l utilisateur demande a economiser ses donnees, la connexion
 * est lente, ou il a demande a reduire les animations. Dans tous, on retombe
 * sur le degrade CSS, qui ne coute rien.
 */
function shouldAvoidVideo(): boolean {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  const saveData = connection?.saveData === true;
  const slowLink = ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return saveData || slowLink || reducedMotion;
}

function useShouldAvoidVideo(): boolean {
  // `useSyncExternalStore` plutot qu un effet : la valeur est lue au rendu
  // cote client et vaut `false` au rendu serveur, sans passer par un
  // `setState` dans un effet ni provoquer d ecart d hydratation.
  return useSyncExternalStore(
    // Ces conditions ne changent pas en cours de session : aucun abonnement.
    () => () => {},
    shouldAvoidVideo,
    () => false,
  );
}

export function TfBackground() {
  const { bg } = useTfTheme();
  const avoidVideo = useShouldAvoidVideo();

  const option = TF_BACKGROUNDS.find((o) => o.id === bg);
  const videoSrc = option?.src ?? null;

  if (videoSrc && !avoidVideo) {
    return (
      <div className="tf-bg" aria-hidden="true">
        {/* Le degrade reste dessous : il occupe l espace pendant que la video
            se charge, evitant un aplat blanc au premier affichage. */}
        <div className="tf-aurora" />
        <video
          key={videoSrc}
          className="tf-bg-video"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          // `none` plutot que `auto` : la version precedente telechargeait la
          // video entiere avant meme de savoir si elle serait affichee.
          preload="none"
        />
      </div>
    );
  }

  return (
    <div className="tf-bg" aria-hidden="true">
      <div className="tf-aurora" />
      <div className="tf-blob tf-blob-1" />
      <div className="tf-blob tf-blob-2" />
      <div className="tf-blob tf-blob-3" />
      <div className="tf-blob tf-blob-4" />
      <div className="tf-stars" />
    </div>
  );
}
