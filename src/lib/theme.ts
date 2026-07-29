/**
 * Vocabulaire du thème.
 *
 * Ce module ne dépend de rien : ni de `next/headers`, ni de Prisma. C'est
 * délibéré — il est lu aussi bien par le rendu serveur que par les
 * résolveurs GraphQL et par le composant client de bascule. Y importer le
 * contexte de requête ferait entrer du code de requête dans un résolveur
 * qui n'en a pas besoin.
 *
 * La lecture du cookie vit dans `theme-server.ts`.
 */

/**
 * Le thème n'est pas une donnée sensible : le cookie est lisible par le
 * client, contrairement aux jetons de session (voir src/lib/cookies.ts).
 * Il ne sert qu'à une chose — permettre au serveur de rendre le bon thème
 * dès le premier octet de HTML.
 */
export const THEME_COOKIE = 'tf_theme';

/** Un an : le choix d'apparence n'a aucune raison d'expirer plus tôt. */
export const THEME_MAX_AGE = 365 * 24 * 60 * 60;

export const THEMES = ['light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

/**
 * `null` n'est pas un défaut manquant, c'est un état à part entière :
 * « aucun choix explicite, suivre le système ». Le rendu n'écrit alors
 * aucun attribut `data-theme` et laisse `prefers-color-scheme` trancher
 * en CSS pur — donc sans script, donc sans flash.
 */
export type ThemeChoice = Theme | null;

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/**
 * Couleur de la barre système du navigateur.
 *
 * Sans choix explicite on ne peut pas la deviner côté serveur : on rend
 * les deux valeurs, chacune sous son `media`, et le navigateur choisit.
 */
export const THEME_COLOR = {
  light: '#F8FAFC',
  dark: '#0B0F19',
} as const satisfies Record<Theme, string>;
