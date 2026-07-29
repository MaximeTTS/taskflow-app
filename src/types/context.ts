export type JwtPayload = {
  id: string;
  email: string;
};

export type Context = {
  user: JwtPayload | null;
  /**
   * Adresse du client, servant de clé au limiteur de débit.
   * `unknown` quand elle ne peut pas être déterminée — toutes les requêtes
   * sans adresse identifiable partagent alors le même quota, ce qui est le
   * comportement prudent.
   */
  ip: string;
};
