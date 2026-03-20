import { prisma } from '@/lib/prisma';

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

// Hiérarchie des rôles — plus le nombre est élevé, plus le rôle est puissant
const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

// Vérifie si un rôle a au moins le niveau requis
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Récupère le rôle d'un utilisateur dans un projet
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

// Vérifie qu'un utilisateur a le rôle minimum requis dans un projet
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
