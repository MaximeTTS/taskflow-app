import { hasMinimumRole } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';

describe('Permissions — hasMinimumRole', () => {
  describe('OWNER', () => {
    it('should have access to OWNER level', () => {
      expect(hasMinimumRole('OWNER', 'OWNER')).toBe(true);
    });

    it('should have access to ADMIN level', () => {
      expect(hasMinimumRole('OWNER', 'ADMIN')).toBe(true);
    });

    it('should have access to MEMBER level', () => {
      expect(hasMinimumRole('OWNER', 'MEMBER')).toBe(true);
    });

    it('should have access to VIEWER level', () => {
      expect(hasMinimumRole('OWNER', 'VIEWER')).toBe(true);
    });
  });

  describe('ADMIN', () => {
    it('should NOT have access to OWNER level', () => {
      expect(hasMinimumRole('ADMIN', 'OWNER')).toBe(false);
    });

    it('should have access to ADMIN level', () => {
      expect(hasMinimumRole('ADMIN', 'ADMIN')).toBe(true);
    });

    it('should have access to MEMBER level', () => {
      expect(hasMinimumRole('ADMIN', 'MEMBER')).toBe(true);
    });

    it('should have access to VIEWER level', () => {
      expect(hasMinimumRole('ADMIN', 'VIEWER')).toBe(true);
    });
  });

  describe('MEMBER', () => {
    it('should NOT have access to OWNER level', () => {
      expect(hasMinimumRole('MEMBER', 'OWNER')).toBe(false);
    });

    it('should NOT have access to ADMIN level', () => {
      expect(hasMinimumRole('MEMBER', 'ADMIN')).toBe(false);
    });

    it('should have access to MEMBER level', () => {
      expect(hasMinimumRole('MEMBER', 'MEMBER')).toBe(true);
    });

    it('should have access to VIEWER level', () => {
      expect(hasMinimumRole('MEMBER', 'VIEWER')).toBe(true);
    });
  });

  describe('VIEWER', () => {
    it('should NOT have access to OWNER level', () => {
      expect(hasMinimumRole('VIEWER', 'OWNER')).toBe(false);
    });

    it('should NOT have access to ADMIN level', () => {
      expect(hasMinimumRole('VIEWER', 'ADMIN')).toBe(false);
    });

    it('should NOT have access to MEMBER level', () => {
      expect(hasMinimumRole('VIEWER', 'MEMBER')).toBe(false);
    });

    it('should have access to VIEWER level', () => {
      expect(hasMinimumRole('VIEWER', 'VIEWER')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle all role combinations', () => {
      const roles: Role[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
      roles.forEach((userRole, i) => {
        roles.forEach((requiredRole, j) => {
          const result = hasMinimumRole(userRole, requiredRole);
          expect(result).toBe(i <= j);
        });
      });
    });
  });
});
