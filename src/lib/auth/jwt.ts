import { SignJWT, jwtVerify } from 'jose';
import type { User } from './types.js';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

export async function signToken(user: User, expiresIn = '8h'): Promise<string> {
  return new SignJWT({
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      username: payload.username as string,
      email: payload.email as string,
      role: payload.role as User['role'],
    };
  } catch {
    return null;
  }
}
