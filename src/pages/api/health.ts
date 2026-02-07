import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAuthConfig } from '../../lib/config.js';

export const GET: APIRoute = async () => {
  const terms = await getCollection('terms');
  const definitions = await getCollection('definitions');
  const products = await getCollection('products');
  const authConfig = getAuthConfig();

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      content: {
        terms: terms.length,
        definitions: definitions.length,
        products: products.length,
      },
      auth_provider: authConfig.auth.provider,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
