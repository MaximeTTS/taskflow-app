import { canAssignRole, canManageMember } from '@/lib/role-utils';
import type { Role } from '@/lib/role-utils';

const ALL_ROLES: Role[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

describe('canAssignRole — un acteur ne peut attribuer qu\'un rôle strictement inférieur au sien', () => {
  it('un OWNER peut attribuer ADMIN, MEMBER et VIEWER', () => {
    expect(canAssignRole('OWNER', 'ADMIN')).toBe(true);
    expect(canAssignRole('OWNER', 'MEMBER')).toBe(true);
    expect(canAssignRole('OWNER', 'VIEWER')).toBe(true);
  });

  it('personne ne peut attribuer le rôle OWNER, pas même un OWNER', () => {
    for (const actor of ALL_ROLES) {
      expect(canAssignRole(actor, 'OWNER')).toBe(false);
    }
  });

  it("un ADMIN ne peut pas se promouvoir ni promouvoir quelqu'un ADMIN", () => {
    expect(canAssignRole('ADMIN', 'ADMIN')).toBe(false);
    expect(canAssignRole('ADMIN', 'OWNER')).toBe(false);
  });

  it('un ADMIN peut attribuer MEMBER et VIEWER', () => {
    expect(canAssignRole('ADMIN', 'MEMBER')).toBe(true);
    expect(canAssignRole('ADMIN', 'VIEWER')).toBe(true);
  });

  it('un MEMBER et un VIEWER ne peuvent attribuer aucun rôle utile', () => {
    expect(canAssignRole('MEMBER', 'VIEWER')).toBe(true);
    expect(canAssignRole('MEMBER', 'MEMBER')).toBe(false);
    expect(canAssignRole('VIEWER', 'VIEWER')).toBe(false);
  });
});

describe('canManageMember — un acteur ne peut agir que sur un membre de rang inférieur', () => {
  it("un ADMIN ne peut pas rétrograder ou expulser un autre ADMIN", () => {
    expect(canManageMember('ADMIN', 'ADMIN')).toBe(false);
  });

  it("un ADMIN ne peut pas toucher au OWNER", () => {
    expect(canManageMember('ADMIN', 'OWNER')).toBe(false);
  });

  it('un ADMIN peut gérer les MEMBER et VIEWER', () => {
    expect(canManageMember('ADMIN', 'MEMBER')).toBe(true);
    expect(canManageMember('ADMIN', 'VIEWER')).toBe(true);
  });

  it('un OWNER peut gérer tout le monde sauf un autre OWNER', () => {
    expect(canManageMember('OWNER', 'ADMIN')).toBe(true);
    expect(canManageMember('OWNER', 'MEMBER')).toBe(true);
    expect(canManageMember('OWNER', 'VIEWER')).toBe(true);
    expect(canManageMember('OWNER', 'OWNER')).toBe(false);
  });

  it('personne ne peut agir sur un rang égal ou supérieur au sien', () => {
    ALL_ROLES.forEach((actor, i) => {
      ALL_ROLES.forEach((target, j) => {
        // i < j signifie que l'acteur est strictement plus haut dans la liste,
        // donc de rang strictement supérieur.
        expect(canManageMember(actor, target)).toBe(i < j);
      });
    });
  });
});
