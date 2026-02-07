import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentStats {
  terms: number;
  definitions: number;
  methods: number;
  versions: number;
  products: number;
  termsPerPhase: Record<string, number>;
  definitionsPerProduct: Record<string, number>;
}

export interface StaleDefinition {
  file: string;
  term: string;
  product: string;
  lastValidated: string | null;
  daysSinceValidation: number | null;
}

export interface OrphanReport {
  termsWithoutDefinitions: string[];
  definitionsWithoutTerms: Array<{ file: string; term: string }>;
}

export interface CoverageEntry {
  product: string;
  totalTerms: number;
  coveredTerms: number;
  coveragePercent: number;
  missingTerms: string[];
}

export interface CoverageReport {
  products: CoverageEntry[];
}

// ---------------------------------------------------------------------------
// Helpers — read content from disk using gray-matter
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

function contentDir(...segments: string[]): string {
  return path.join(ROOT, 'src', 'content', ...segments);
}

function configDir(...segments: string[]): string {
  return path.join(ROOT, 'config', ...segments);
}

function readMarkdownFiles(dir: string): Array<{ file: string; data: Record<string, unknown>; content: string }> {
  if (!fs.existsSync(dir)) return [];
  const entries: Array<{ file: string; data: Record<string, unknown>; content: string }> = [];

  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.md')) {
        const raw = fs.readFileSync(full, 'utf-8');
        const parsed = matter(raw);
        entries.push({
          file: path.relative(contentDir(), full),
          data: parsed.data as Record<string, unknown>,
          content: parsed.content,
        });
      }
    }
  };

  walk(dir);
  return entries;
}

function listSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Count all content items and break down by phase / product.
 */
export function getContentStats(): ContentStats {
  const termFiles = readMarkdownFiles(contentDir('terms'));
  const definitionFiles = readMarkdownFiles(contentDir('definitions'));
  const methodFiles = readMarkdownFiles(contentDir('methods'));
  const versionFiles = readMarkdownFiles(contentDir('versions'));
  const productFiles = readMarkdownFiles(contentDir('products'));

  const termsPerPhase: Record<string, number> = {};
  for (const t of termFiles) {
    const phase = String(t.data.custdev_phase ?? 'unknown');
    termsPerPhase[phase] = (termsPerPhase[phase] ?? 0) + 1;
  }

  const definitionsPerProduct: Record<string, number> = {};
  for (const d of definitionFiles) {
    const product = String(d.data.product ?? 'global');
    definitionsPerProduct[product] = (definitionsPerProduct[product] ?? 0) + 1;
  }

  return {
    terms: termFiles.length,
    definitions: definitionFiles.length,
    methods: methodFiles.length,
    versions: versionFiles.length,
    products: productFiles.length,
    termsPerPhase,
    definitionsPerProduct,
  };
}

/**
 * Find definitions whose `last_validated` date exceeds the threshold.
 */
export function getStalenessReport(thresholdDays: number): StaleDefinition[] {
  const definitions = readMarkdownFiles(contentDir('definitions'));
  const now = Date.now();
  const stale: StaleDefinition[] = [];

  for (const d of definitions) {
    const lastValidated = d.data.last_validated;
    let daysSince: number | null = null;
    let dateStr: string | null = null;

    if (lastValidated) {
      const ts = new Date(String(lastValidated)).getTime();
      if (!isNaN(ts)) {
        daysSince = Math.floor((now - ts) / (1000 * 60 * 60 * 24));
        dateStr = new Date(ts).toISOString().slice(0, 10);
      }
    }

    // Flag if missing last_validated or if it exceeds the threshold
    if (daysSince === null || daysSince > thresholdDays) {
      stale.push({
        file: d.file,
        term: String(d.data.term ?? ''),
        product: String(d.data.product ?? 'global'),
        lastValidated: dateStr,
        daysSinceValidation: daysSince,
      });
    }
  }

  return stale;
}

/**
 * Find orphaned content: terms without definitions and definitions without terms.
 */
export function getOrphanReport(): OrphanReport {
  const termSlugs = listSlugs(contentDir('terms'));
  const definitionDirs = listDirs(contentDir('definitions'));
  const definitions = readMarkdownFiles(contentDir('definitions'));

  // Terms that have no matching definition directory
  const termsWithoutDefinitions = termSlugs.filter((slug) => !definitionDirs.includes(slug));

  // Definitions whose `term` frontmatter field doesn't match any term file
  const definitionsWithoutTerms: Array<{ file: string; term: string }> = [];
  for (const d of definitions) {
    const termRef = String(d.data.term ?? '');
    if (termRef && !termSlugs.includes(termRef)) {
      definitionsWithoutTerms.push({ file: d.file, term: termRef });
    }
  }

  return { termsWithoutDefinitions, definitionsWithoutTerms };
}

/**
 * Per-product coverage: how many terms have a definition for each product.
 */
export function getCoverageReport(): CoverageReport {
  const termSlugs = listSlugs(contentDir('terms'));
  const definitions = readMarkdownFiles(contentDir('definitions'));

  // Gather all unique products from definitions + product content files
  const productSlugs = new Set<string>();
  const productFiles = listSlugs(contentDir('products'));
  for (const p of productFiles) {
    productSlugs.add(p);
  }
  for (const d of definitions) {
    const product = String(d.data.product ?? 'global');
    if (product !== 'global') {
      productSlugs.add(product);
    }
  }

  // Also include "global" as a pseudo-product
  productSlugs.add('global');

  const products: CoverageEntry[] = [];

  for (const product of productSlugs) {
    const coveredTerms = new Set<string>();
    for (const d of definitions) {
      if (String(d.data.product ?? 'global') === product) {
        coveredTerms.add(String(d.data.term ?? ''));
      }
    }

    const missing = termSlugs.filter((t) => !coveredTerms.has(t));
    products.push({
      product,
      totalTerms: termSlugs.length,
      coveredTerms: coveredTerms.size,
      coveragePercent: termSlugs.length > 0 ? Math.round((coveredTerms.size / termSlugs.length) * 100) : 0,
      missingTerms: missing,
    });
  }

  // Sort: global first, then alphabetical
  products.sort((a, b) => {
    if (a.product === 'global') return -1;
    if (b.product === 'global') return 1;
    return a.product.localeCompare(b.product);
  });

  return { products };
}
