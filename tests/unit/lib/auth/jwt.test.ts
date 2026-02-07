import { describe, it, expect, beforeAll } from 'vitest';
import { signToken, verifyToken } from '../../../../src/lib/auth/jwt.js';
import type { User } from '../../../../src/lib/auth/types.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-unit-tests';
});

const testUser: User = {
  username: 'testuser',
  email: 'test@localhost',
  role: 'admin',
};

describe('JWT', () => {
  it('should sign and verify a token', async () => {
    const token = await signToken(testUser);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.username).toBe('testuser');
    expect(decoded!.email).toBe('test@localhost');
    expect(decoded!.role).toBe('admin');
  });

  it('should return null for invalid token', async () => {
    const result = await verifyToken('invalid-token');
    expect(result).toBeNull();
  });

  it('should return null for tampered token', async () => {
    const token = await signToken(testUser);
    const tampered = token.slice(0, -5) + 'XXXXX';
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });

  it('should include all user fields in token', async () => {
    const token = await signToken({
      username: 'editor1',
      email: 'editor@localhost',
      role: 'editor',
    });
    const decoded = await verifyToken(token);
    expect(decoded!.role).toBe('editor');
  });
});
