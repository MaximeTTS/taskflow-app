/**
 * Definitions SVG partagees par tout le verre de l'interface.
 *
 * Monte une seule fois, dans le layout racine : les filtres sont references
 * par `filter: url(#id)` depuis le CSS, il n'en faut donc qu'un exemplaire
 * dans le document.
 *
 * Deux filtres, deux intensites :
 *  - `tf-refract`      : panneaux larges (cartes, barres, feuilles)
 *  - `tf-refract-fine` : petits elements (boutons, pastilles), ou une
 *                        turbulence trop grossiere deformerait le texte
 *
 * `baseFrequency` gouverne la taille des ondulations, `scale` leur amplitude.
 * Les valeurs sont volontairement plus basses que celles des exemples de
 * reference (scale 77) : a cette amplitude le texte sous-jacent devient
 * illisible sur un panneau contenant de l'interface, alors que la demo
 * d'origine ne montrait qu'une carte decorative.
 */
export function GlassFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <defs>
        <filter id="tf-refract" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.011"
            numOctaves={2}
            seed={7}
            result="bruit"
          />
          {/* Adoucit le bruit : sans ce flou, la deformation granuleuse
              accroche l'oeil au lieu de suggerer une matiere. */}
          <feGaussianBlur in="bruit" stdDeviation="1.4" result="bruitDoux" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="bruitDoux"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="tf-refract-fine" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014 0.02"
            numOctaves={1}
            seed={3}
            result="bruit"
          />
          <feGaussianBlur in="bruit" stdDeviation="0.8" result="bruitDoux" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="bruitDoux"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
