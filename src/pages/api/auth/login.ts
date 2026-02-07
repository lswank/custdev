import type { APIRoute } from 'astro';
import { getAuthProvider } from '../../../lib/auth/index.js';
import { getAuthConfig } from '../../../lib/config.js';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return redirect('/login?error=Username+and+password+are+required');
  }

  const provider = getAuthProvider();
  const token = await provider.login(username, password);

  if (!token) {
    return redirect('/login?error=Invalid+username+or+password');
  }

  const config = getAuthConfig();
  const cookieName = config.auth.jwt?.cookie_name || 'wiki_session';

  cookies.set(cookieName, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return redirect('/');
};
