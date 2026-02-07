import { getAuthConfig } from '../config.js';
import { LocalAuthProvider } from './local-provider.js';
import type { AuthProvider } from './types.js';

export type { AuthProvider, User, Session } from './types.js';

let _provider: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (!_provider) {
    const config = getAuthConfig();
    switch (config.auth.provider) {
      case 'local':
        _provider = new LocalAuthProvider();
        break;
      // Future: case 'github': _provider = new GitHubAuthProvider(); break;
      // Future: case 'gitlab': _provider = new GitLabAuthProvider(); break;
      default:
        _provider = new LocalAuthProvider();
    }
  }
  return _provider;
}
