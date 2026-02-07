import bcrypt from 'bcryptjs';
import { signToken, verifyToken } from './jwt.js';
import { getAuthConfig } from '../config.js';
import type { AuthProvider, User } from './types.js';

export class LocalAuthProvider implements AuthProvider {
  async login(username: string, password: string): Promise<string | null> {
    const config = getAuthConfig();
    const userEntry = config.auth.local.users.find(
      (u) => u.username === username
    );
    if (!userEntry) return null;

    const valid = await bcrypt.compare(password, userEntry.password_hash);
    if (!valid) return null;

    const user: User = {
      username: userEntry.username,
      email: userEntry.email,
      role: userEntry.role as User['role'],
    };

    return signToken(user);
  }

  async logout(_token: string): Promise<void> {
    // Stateless JWT — logout handled by clearing the cookie client-side
  }

  async getUser(token: string): Promise<User | null> {
    return verifyToken(token);
  }

  async validateToken(token: string): Promise<boolean> {
    const user = await verifyToken(token);
    return user !== null;
  }
}
