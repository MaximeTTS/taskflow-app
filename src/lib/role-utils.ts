export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Un acteur peut-il attribuer ce rôle ?
 *
 * Règle : uniquement un rôle strictement inférieur au sien. Il en découle
 * qu'OWNER n'est attribuable par personne — le transfert de propriété est une
 * opération distincte, pas un changement de rôle.
 *
 * Sans cette règle, `requireProjectRole(..., 'ADMIN')` autorisait un ADMIN à
 * se promouvoir OWNER, puis à supprimer le projet.
 */
export function canAssignRole(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[targetRole] < ROLE_HIERARCHY[actorRole];
}

/**
 * Un acteur peut-il agir sur ce membre (le rétrograder, l'expulser) ?
 *
 * Règle : uniquement sur un membre de rang strictement inférieur. Deux ADMIN
 * ne peuvent donc pas s'expulser mutuellement, et personne ne touche au OWNER.
 */
export function canManageMember(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[targetRole] < ROLE_HIERARCHY[actorRole];
}
