import { describe, it, expect, beforeAll } from 'vitest';
import { LocalAuthProvider } from '../../../../src/lib/auth/local-provider.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-unit-tests';
});

describe('LocalAuthProvider', () => {
  const provider = new LocalAuthProvider();

  it('should login with valid admin credentials', async () => {
    const token = await provider.login('admin', 'admin');
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('should return null for invalid password', async () => {
    const token = await provider.login('admin', 'wrong-password');
    expect(token).toBeNull();
  });

  it('should return null for non-existent user', async () => {
    const token = await provider.login('nobody', 'password');
    expect(token).toBeNull();
  });

  it('should validate a token from successful login', async () => {
    const token = await provider.login('admin', 'admin');
    expect(token).toBeTruthy();

    const valid = await provider.validateToken(token!);
    expect(valid).toBe(true);
  });

  it('should get user from valid token', async () => {
    const token = await provider.login('editor', 'editor');
    expect(token).toBeTruthy();

    const user = await provider.getUser(token!);
    expect(user).not.toBeNull();
    expect(user!.username).toBe('editor');
    expect(user!.role).toBe('editor');
  });

  it('should return null for invalid token', async () => {
    const user = await provider.getUser('invalid-token');
    expect(user).toBeNull();
  });

  it('should not validate an invalid token', async () => {
    const valid = await provider.validateToken('bad-token');
    expect(valid).toBe(false);
  });
});
