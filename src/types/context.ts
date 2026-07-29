export type JwtPayload = {
  id: string;
  email: string;
};

export type Context = {
  user: JwtPayload | null;
  /**
   * Adresse du client, servant de clé au limiteur de débit et au journal
   * d'audit. `unknown` quand elle ne peut pas être déterminée — toutes les
   * requêtes sans adresse identifiable partagent alors le même quota, ce qui
   * est le comportement prudent.
   */
  ip: string;
  /**
   * Origine du site (`https://exemple.com`), pour composer les liens envoyés
   * par email.
   *
   * Lue sur la requête plutôt que dans une variable d'environnement : les
   * préproductions et les déploiements de prévisualisation changent de nom de
   * domaine à chaque fois, et un lien de confirmation pointant vers la
   * production depuis une préproduction ne fonctionne pas.
   */
  origin: string;
};
