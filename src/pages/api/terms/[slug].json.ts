import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;

  const terms = await getCollection('terms');
  const term = terms.find((t) => t.id === slug);

  if (!term) {
    return new Response(JSON.stringify({ error: 'Term not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allDefinitions = await getCollection('definitions');
  const definitions = allDefinitions
    .filter((d) => d.data.term === slug)
    .map((d) => ({
      product: d.data.product,
      phase: d.data.custdev_phase,
      confidence: d.data.confidence,
      version: d.data.version,
      method: d.data.method,
      status: d.data.status,
      override_reason: d.data.override_reason,
    }));

  const allVersions = await getCollection('versions');
  const versions = allVersions
    .filter((v) => v.data.term === slug)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((v) => ({
      version: v.data.version,
      date: v.data.date.toISOString(),
      author: v.data.author,
      change_summary: v.data.change_summary,
      custdev_trigger: v.data.custdev_trigger,
    }));

  return new Response(
    JSON.stringify({
      term: {
        slug: term.id,
        name: term.data.name,
        aliases: term.data.aliases,
        phase: term.data.custdev_phase,
        owner: term.data.owner,
        status: term.data.status,
      },
      definitions,
      versions,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
