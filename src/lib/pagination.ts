/**
 * Bornes de pagination.
 *
 * `projects`, `tasks` et `users` renvoyaient tout. Sur un compte fourni, c'est
 * une lenteur ; sur un compte volontairement gonflé, c'est un levier de déni
 * de service — une requête, et le serveur sérialise des dizaines de milliers
 * de lignes.
 *
 * Le plafond n'est pas négociable par le client. Un `limit` absent prend la
 * valeur par défaut, un `limit` déraisonnable est ramené au maximum plutôt que
 * rejeté : une requête un peu gourmande doit être servie modestement, pas
 * échouer.
 */

export type PageArgs = {
  limit?: number | null;
  offset?: number | null;
};

export type PageBounds = {
  take: number;
  skip: number;
};

export type Page<T> = {
  items: T[];
  totalCount: number;
  hasMore: boolean;
};

/** Plafond absolu, toutes listes confondues. */
export const PAGE_MAX = 100;

/**
 * Traduit les arguments du client en bornes sûres.
 *
 * `defaultLimit` varie d'une liste à l'autre : un tableau de bord affiche
 * deux douzaines de projets, un tableau Kanban a besoin de plus de tâches pour
 * rester utilisable.
 */
export function pageBounds(args: PageArgs, defaultLimit: number): PageBounds {
  const demandé = args.limit ?? defaultLimit;

  // `Math.trunc` écarte les décimales, et le maximum écarte à la fois les
  // valeurs négatives et zéro — un `limit: 0` répété serait un moyen commode
  // de faire tourner la base à vide.
  const take = Math.min(Math.max(1, Math.trunc(demandé) || defaultLimit), PAGE_MAX);
  const skip = Math.max(0, Math.trunc(args.offset ?? 0) || 0);

  return { take, skip };
}

/** Assemble une page à partir des lignes et du total. */
export function toPage<T>(items: T[], totalCount: number, skip: number): Page<T> {
  return {
    items,
    totalCount,
    // Calculé sur ce qui a réellement été rendu, et non sur `skip + take` :
    // une page incomplète signifie qu'il n'y a plus rien après.
    hasMore: skip + items.length < totalCount,
  };
}
