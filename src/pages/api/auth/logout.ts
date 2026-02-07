import type { APIRoute } from 'astro';
import { getAuthConfig } from '../../../lib/config.js';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const config = getAuthConfig();
  const cookieName = config.auth.jwt?.cookie_name || 'wiki_session';

  cookies.delete(cookieName, { path: '/' });
  return redirect('/login');
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const config = getAuthConfig();
  const cookieName = config.auth.jwt?.cookie_name || 'wiki_session';

  cookies.delete(cookieName, { path: '/' });
  return redirect('/login');
};
