import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractTokenFromHeader,
} from '@/lib/auth';

describe('Auth — hashPassword & verifyPassword', () => {
  it('should hash a password', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(hash).toMatch(/^\$2b\$/);
  });

  it('should verify a correct password', async () => {
    const hash = await hashPassword('password123');
    const result = await verifyPassword('password123', hash);
    expect(result).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('password123');
    const result = await verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });
});

describe('Auth — generateToken & verifyToken', () => {
  const payload = { id: 'user-123', email: 'test@test.com' };

  it('should generate a JWT token', () => {
    const token = generateToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid token', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(payload.id);
    expect(decoded?.email).toBe(payload.email);
  });

  it('should return null for an invalid token', () => {
    const result = verifyToken('invalid.token.here');
    expect(result).toBeNull();
  });

  it('should return null for an empty token', () => {
    const result = verifyToken('');
    expect(result).toBeNull();
  });
});

describe('Auth — extractTokenFromHeader', () => {
  it('should extract token from valid Bearer header', () => {
    const token = extractTokenFromHeader('Bearer mytoken123');
    expect(token).toBe('mytoken123');
  });

  it('should return null for missing header', () => {
    const token = extractTokenFromHeader(null);
    expect(token).toBeNull();
  });

  it('should return null for invalid format', () => {
    const token = extractTokenFromHeader('InvalidFormat');
    expect(token).toBeNull();
  });

  it('should return null for empty Bearer', () => {
    const token = extractTokenFromHeader('Bearer');
    expect(token).toBeNull();
  });
});
