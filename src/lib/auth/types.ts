export interface User {
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'contributor';
}

export interface Session {
  user: User;
  expiresAt: Date;
}

export interface AuthProvider {
  login(username: string, password: string): Promise<string | null>;
  logout(token: string): Promise<void>;
  getUser(token: string): Promise<User | null>;
  validateToken(token: string): Promise<boolean>;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: User;
}
