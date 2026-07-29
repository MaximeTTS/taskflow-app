/**
 * Validation des entrées utilisateur.
 *
 * GraphQL garantit les types (String, ID) mais jamais la forme : sans ces
 * gardes, un mot de passe d'un caractère ou un titre de 10 Mo passaient
 * directement en base.
 */

export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Longueur maximale d'une adresse email (RFC 5321). */
const EMAIL_MAX = 254;

/**
 * bcrypt ne prend en compte que les 72 premiers octets : au-delà, deux mots
 * de passe différents produisent le même hash. On refuse plutôt que de
 * tronquer silencieusement.
 */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX_BYTES = 72;

/** Volontairement stricte : une seule arobase, un domaine avec point, pas d'espace. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertValidEmail(email: string): void {
  const value = email.trim();
  if (value.length === 0) {
    throw new ValidationError("L'adresse email est requise");
  }
  if (value.length > EMAIL_MAX) {
    throw new ValidationError("L'adresse email est trop longue");
  }
  if (!EMAIL_PATTERN.test(value)) {
    throw new ValidationError("Format d'adresse email invalide");
  }
}

export function assertValidPassword(password: string): void {
  if (password.length < PASSWORD_MIN) {
    throw new ValidationError(
      `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères`,
    );
  }
  const bytes = Buffer.byteLength(password, 'utf8');
  if (bytes > PASSWORD_MAX_BYTES) {
    throw new ValidationError(
      `Le mot de passe est trop long (maximum ${PASSWORD_MAX_BYTES} octets)`,
    );
  }
}

type LengthBounds = { min: number; max: number };

/**
 * Valide la longueur d'un champ texte. Une valeur absente est acceptée :
 * l'obligation d'un champ relève du schéma GraphQL, pas de cette fonction.
 */
export function assertLength(
  value: string | null | undefined,
  fieldName: string,
  { min, max }: LengthBounds,
): void {
  if (value === null || value === undefined) return;

  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new ValidationError(
      min === 1
        ? `Le champ « ${fieldName} » ne peut pas être vide`
        : `Le champ « ${fieldName} » doit contenir au moins ${min} caractères`,
    );
  }
  if (trimmed.length > max) {
    throw new ValidationError(
      `Le champ « ${fieldName} » ne peut pas dépasser ${max} caractères`,
    );
  }
}

/** Bornes appliquées aux champs métier. */
export const LIMITS = {
  userName: { min: 1, max: 80 },
  projectName: { min: 1, max: 120 },
  projectDescription: { min: 0, max: 2000 },
  taskTitle: { min: 1, max: 200 },
  taskDescription: { min: 0, max: 5000 },
} as const;
