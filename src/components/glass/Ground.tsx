/**
 * Le sol de l'application.
 *
 * Trois nappes de lumière très lentes et une couche de grain. Ce n'est pas
 * de la décoration : le verre ne réfracte que ce qui se trouve derrière lui.
 * Sur un aplat uniforme, les panneaux ne seraient que des rectangles gris.
 *
 * Rendu côté serveur, sans état ni interaction — d'où l'absence de
 * directive client.
 */
export function Ground() {
  return (
    <div className="tf-ground" aria-hidden="true">
      <div className="tf-glow tf-glow-1" />
      <div className="tf-glow tf-glow-2" />
      <div className="tf-glow tf-glow-3" />
      <div className="tf-grain" />
    </div>
  );
}
