import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

interface SearchResult {
  title: string;
  url: string;
  collection: string;
  excerpt: string;
}

const stripMd = (id: string) => id.replace(/\.md$/, '');

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();

  if (!query) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  const matches = (text: string) => {
    const lower = text.toLowerCase();
    return tokens.every((t) => lower.includes(t));
  };

  const results: SearchResult[] = [];

  // Terms
  const terms = await getCollection('terms');
  for (const item of terms) {
    const searchable = [
      item.data.name,
      ...(item.data.aliases || []),
      item.data.custdev_phase,
      item.data.status,
      item.data.owner,
    ].join(' ');
    if (matches(searchable)) {
      results.push({
        title: item.data.name,
        url: `/terms/${stripMd(item.id)}`,
        collection: 'Terms',
        excerpt: `Phase: ${item.data.custdev_phase} · Status: ${item.data.status}${item.data.aliases.length ? ` · Also: ${item.data.aliases.join(', ')}` : ''}`,
      });
    }
  }

  // People
  const people = await getCollection('people');
  for (const item of people) {
    const searchable = [
      item.data.name,
      item.data.role,
      item.data.title || '',
      ...(item.data.expertise || []),
      item.data.company || '',
      item.data.department || '',
    ].join(' ');
    if (matches(searchable)) {
      results.push({
        title: item.data.name,
        url: `/people/${stripMd(item.id)}`,
        collection: 'People',
        excerpt: `${item.data.role}${item.data.title ? ` · ${item.data.title}` : ''}${item.data.expertise.length ? ` · ${item.data.expertise.slice(0, 3).join(', ')}` : ''}`,
      });
    }
  }

  // Products
  const products = await getCollection('products');
  for (const item of products) {
    const searchable = [item.data.name, item.data.description, item.data.custdev_phase].join(' ');
    if (matches(searchable)) {
      results.push({
        title: item.data.name,
        url: `/products/${stripMd(item.id)}`,
        collection: 'Products',
        excerpt: item.data.description.length > 120 ? item.data.description.slice(0, 120) + '...' : item.data.description,
      });
    }
  }

  // Entities
  const entities = await getCollection('entities');
  for (const item of entities) {
    const searchable = [
      item.data.name,
      item.data.legal_name || '',
      item.data.description || '',
      item.data.jurisdiction || '',
      item.data.entity_type || '',
      item.data.status,
    ].join(' ');
    if (matches(searchable)) {
      results.push({
        title: item.data.name,
        url: `/entities/${stripMd(item.id)}`,
        collection: 'Entities',
        excerpt: `${item.data.entity_type || 'Entity'} · ${item.data.status}${item.data.jurisdiction ? ` · ${item.data.jurisdiction}` : ''}`,
      });
    }
  }

  // Repositories
  const repos = await getCollection('repositories');
  for (const item of repos) {
    const searchable = [
      item.data.name,
      item.data.description,
      item.data.language,
      ...(item.data.tech_stack || []),
    ].join(' ');
    if (matches(searchable)) {
      results.push({
        title: item.data.name,
        url: `/repositories/${stripMd(item.id)}`,
        collection: 'Repositories',
        excerpt: `${item.data.language} · ${item.data.description.length > 100 ? item.data.description.slice(0, 100) + '...' : item.data.description}`,
      });
    }
  }

  // ADRs
  const adrs = await getCollection('adrs');
  for (const item of adrs) {
    const searchable = [
      item.data.title,
      String(item.data.number),
      item.data.status,
      ...(item.data.tags || []),
    ].join(' ');
    if (matches(searchable)) {
      results.push({
        title: `ADR-${String(item.data.number).padStart(3, '0')}: ${item.data.title}`,
        url: `/adrs/${item.data.number}`,
        collection: 'ADRs',
        excerpt: `Status: ${item.data.status}${item.data.tags.length ? ` · ${item.data.tags.join(', ')}` : ''}`,
      });
    }
  }

  // Processes
  const processes = await getCollection('processes');
  for (const item of processes) {
    const searchable = [
      item.data.title,
      item.data.category,
      item.data.owner || '',
      ...(item.data.tools || []),
    ].join(' ');
    if (matches(searchable)) {
      results.push({
        title: item.data.title,
        url: `/processes/${stripMd(item.id)}`,
        collection: 'Processes',
        excerpt: `${item.data.category}${item.data.tools.length ? ` · Tools: ${item.data.tools.join(', ')}` : ''}`,
      });
    }
  }

  // Resources
  const resources = await getCollection('resources');
  for (const item of resources) {
    const searchable = [
      item.data.name,
      item.data.category,
      item.data.owner || '',
      ...(item.data.used_by || []),
    ].join(' ');
    if (matches(searchable)) {
      results.push({
        title: item.data.name,
        url: `/resources/${stripMd(item.id)}`,
        collection: 'Resources',
        excerpt: `${item.data.category} · ${item.data.status}`,
      });
    }
  }

  // Definitions (search by term name + product)
  const definitions = await getCollection('definitions');
  for (const item of definitions) {
    const termName = terms.find((t) => stripMd(t.id) === item.data.term)?.data.name || item.data.term;
    const searchable = [termName, item.data.product, item.data.method].join(' ');
    if (matches(searchable)) {
      results.push({
        title: `${termName} (${item.data.product} definition)`,
        url: `/terms/${item.data.term}`,
        collection: 'Definitions',
        excerpt: `Confidence: ${item.data.confidence} · v${item.data.version} · Method: ${item.data.method}`,
      });
    }
  }

  return new Response(JSON.stringify({ results: results.slice(0, 50) }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
