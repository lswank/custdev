import { getCollection, type CollectionEntry } from 'astro:content';

export type Term = CollectionEntry<'terms'>;
export type Definition = CollectionEntry<'definitions'>;

/**
 * Get all terms, optionally filtered by CustDev phase or status.
 */
export async function getTerms(filters?: {
  phase?: string;
  status?: string;
}): Promise<Term[]> {
  const terms = await getCollection('terms');
  return terms.filter((t) => {
    if (filters?.phase && t.data.custdev_phase !== filters.phase) return false;
    if (filters?.status && t.data.status !== filters.status) return false;
    return true;
  });
}

/**
 * Get a single term by its slug.
 */
export async function getTermBySlug(slug: string): Promise<Term | undefined> {
  const terms = await getCollection('terms');
  return terms.find((t) => t.id === slug);
}

/**
 * Find a term by alias. Returns the canonical term if found.
 */
export async function findTermByAlias(alias: string): Promise<Term | undefined> {
  const terms = await getCollection('terms');
  const lower = alias.toLowerCase();
  return terms.find(
    (t) =>
      t.data.name.toLowerCase() === lower ||
      t.data.aliases.some((a) => a.toLowerCase() === lower)
  );
}

/**
 * Get all definitions for a term, optionally filtered by product.
 */
export async function getDefinitionsForTerm(
  termSlug: string,
  product?: string
): Promise<Definition[]> {
  const definitions = await getCollection('definitions');
  return definitions.filter((d) => {
    if (d.data.term !== termSlug) return false;
    if (product && d.data.product !== product) return false;
    return true;
  });
}

/**
 * Resolve the best definition for a term given a product context.
 *
 * Resolution rules:
 * 1. If product context given → return product-specific definition if it exists
 * 2. If no product-specific definition → fall back to global
 * 3. If no global definition → return undefined
 */
export async function resolveDefinition(
  termSlug: string,
  product?: string
): Promise<{
  definition: Definition | undefined;
  isOverride: boolean;
  globalDefinition: Definition | undefined;
  allDefinitions: Definition[];
}> {
  const allDefinitions = await getDefinitionsForTerm(termSlug);
  const globalDefinition = allDefinitions.find((d) => d.data.product === 'global');

  if (product && product !== 'global') {
    const productDefinition = allDefinitions.find((d) => d.data.product === product);
    if (productDefinition) {
      return {
        definition: productDefinition,
        isOverride: true,
        globalDefinition,
        allDefinitions,
      };
    }
  }

  return {
    definition: globalDefinition,
    isOverride: false,
    globalDefinition,
    allDefinitions,
  };
}

/**
 * Get all products that have definitions for a given term.
 */
export async function getProductsForTerm(termSlug: string): Promise<string[]> {
  const definitions = await getDefinitionsForTerm(termSlug);
  return [...new Set(definitions.map((d) => d.data.product))];
}

/**
 * Get the version history for a term, sorted by date descending.
 */
export async function getVersionHistory(
  termSlug: string
): Promise<CollectionEntry<'versions'>[]> {
  const versions = await getCollection('versions');
  return versions
    .filter((v) => v.data.term === termSlug)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * Check if a product-specific definition contradicts the global one.
 * Returns true if both exist and have different confidence levels.
 */
export async function hasConflict(
  termSlug: string,
  product: string
): Promise<boolean> {
  const definitions = await getDefinitionsForTerm(termSlug);
  const global = definitions.find((d) => d.data.product === 'global');
  const specific = definitions.find((d) => d.data.product === product);

  if (!global || !specific) return false;
  return global.data.confidence !== specific.data.confidence;
}
