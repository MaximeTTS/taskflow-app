/**
 * Accès aux variables d'environnement sensibles.
 *
 * Règle : aucune valeur de repli. Un secret manquant doit faire échouer
 * bruyamment au démarrage, jamais dégrader silencieusement la sécurité.
 * L'ancien `process.env.JWT_SECRET ?? 'fallback-secret'` signifiait qu'un
 * oubli de configuration en production laissait n'importe qui forger un
 * jeton valide.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `L'application refuse de démarrer sans cette valeur.`,
    );
  }
  return value;
}

export function getJwtSecret(): string {
  const secret = required('JWT_SECRET');
  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET doit faire au moins 32 caractères. ' +
        'Générer une valeur : node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
    );
  }
  return secret;
}

export function getDatabaseUrl(): string {
  return required('DATABASE_URL');
}

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
