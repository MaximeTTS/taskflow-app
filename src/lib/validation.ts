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

// La robustesse des mots de passe vit dans son propre module : elle n'a rien
// de commun avec la validation de forme, et la page d'inscription l'importe
// seule pour donner un retour immédiat. Réexporté ici pour que les appelants
// existants n'aient pas à connaître ce découpage.
import { checkPassword, PASSWORD_MIN, PASSWORD_MAX_BYTES } from '@/lib/password-strength';
import type { PasswordContext } from '@/lib/password-strength';

export { checkPassword, PASSWORD_MIN, PASSWORD_MAX_BYTES };
export type { PasswordContext, PasswordVerdict } from '@/lib/password-strength';

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

/**
 * Refuse un mot de passe trop facile à deviner.
 *
 * `context` porte l'email et le nom du compte concerné : un mot de passe qui
 * les reprend est le premier essai d'un attaquant. L'omettre reste possible —
 * les autres contrôles s'appliquent — mais tous les appelants qui connaissent
 * le compte doivent le fournir.
 */
export function assertValidPassword(password: string, context: PasswordContext = {}): void {
  const verdict = checkPassword(password, context);
  if (!verdict.ok) {
    throw new ValidationError(verdict.reason);
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
