/**
 * Environnement des tests.
 *
 * `getJwtSecret()` lève désormais si JWT_SECRET est absent ou trop court —
 * c'est le comportement voulu en production. Les tests ont donc besoin d'un
 * secret dédié, qui n'a évidemment aucun rapport avec celui du .env.
 */
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'secret-de-test-uniquement-non-utilise-en-production-0123456789';
