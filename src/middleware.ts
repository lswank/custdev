import { defineMiddleware } from 'astro:middleware';
import { getAuthProvider } from './lib/auth/index.js';
import { getAuthConfig } from './lib/config.js';

const PROTECTED_PREFIXES = ['/admin', '/api/cms', '/api/governance'];
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/me', '/api/health'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Skip auth for public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_') ||
    pathname.startsWith('/pagefind/')
  ) {
    return next();
  }

  const config = getAuthConfig();
  const cookieName = config.auth.jwt?.cookie_name || 'wiki_session';
  const token = context.cookies.get(cookieName)?.value;

  if (token) {
    const provider = getAuthProvider();
    const user = await provider.getUser(token);
    if (user) {
      context.locals.user = user;
      context.locals.session = {
        user,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      };
    }
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !context.locals.user) {
    return context.redirect('/login');
  }

  return next();
});
