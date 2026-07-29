/**
 * Ambiance de fond.
 *
 * Deux nappes très lentes et une couche de grain. Ce n'est pas de la
 * décoration : sur un aplat uniforme, les bords des cartes ne se détachent
 * plus et l'interface paraît posée sur du papier.
 *
 * L'intensité vit dans le CSS, pas ici — elle dépend du thème, et le
 * composant n'a pas à savoir lequel est actif. Rendu côté serveur, sans état
 * ni interaction, d'où l'absence de directive client.
 */
export function Aura() {
  return (
    <div className="tf-aura" aria-hidden="true">
      <span />
      <span />
      <b />
    </div>
  );
}
