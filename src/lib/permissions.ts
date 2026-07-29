import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/role-utils';
import { hasMinimumRole } from '@/lib/role-utils';

export type { Role } from '@/lib/role-utils';
export { hasMinimumRole, canAssignRole, canManageMember } from '@/lib/role-utils';

export async function getUserRoleInProject(
  userId: string,
  projectId: string,
): Promise<Role | null> {
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
  return membership ? (membership.role as Role) : null;
}

/**
 * Vérifie que l'utilisateur atteint le rôle demandé sur ce projet et rend son
 * rôle effectif, dont les appelants ont besoin pour les règles d'escalade.
 *
 * Le message d'erreur est identique qu'on ne soit pas membre ou que le rôle
 * soit insuffisant : la version précédente répondait « Rôle requis : ADMIN,
 * votre rôle : VIEWER », ce qui confirmait l'existence du projet et exposait
 * la hiérarchie à un utilisateur qui n'y a pas accès.
 */
export async function requireProjectRole(
  userId: string,
  projectId: string,
  requiredRole: Role,
): Promise<Role> {
  const role = await getUserRoleInProject(userId, projectId);
  if (!role || !hasMinimumRole(role, requiredRole)) {
    throw new Error("Action non autorisée");
  }
  return role;
}
