import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/role-utils';
import { hasMinimumRole } from '@/lib/role-utils';

export type { Role } from '@/lib/role-utils';
export { hasMinimumRole } from '@/lib/role-utils';

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

export async function requireProjectRole(
  userId: string,
  projectId: string,
  requiredRole: Role,
): Promise<void> {
  const role = await getUserRoleInProject(userId, projectId);
  if (!role) {
    throw new Error("Vous n'êtes pas membre de ce projet");
  }
  if (!hasMinimumRole(role, requiredRole)) {
    throw new Error(`Action non autorisée. Rôle requis : ${requiredRole}, votre rôle : ${role}`);
  }
}
