#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GovernanceReport {
  generatedAt: string;
  staleness: StaleItem[];
  orphans: {
    termsWithoutDefinitions: string[];
    definitionsWithoutTerms: Array<{ file: string; term: string }>;
  };
  coverage: {
    termsPerPhase: Record<string, number>;
    definitionsPerProduct: Record<string, number>;
  };
  confidenceDrift: DriftItem[];
  brevityWarnings: BrevityItem[];
}

interface StaleItem {
  file: string;
  term: string;
  product: string;
  lastValidated: string | null;
  daysSinceValidation: number | null;
}

interface DriftItem {
  file: string;
  term: string;
  product: string;
  productPhase: string;
  confidence: string;
}

interface BrevityItem {
  file: string;
  term: string;
  product: string;
  charCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

function contentDir(...segments: string[]): string {
  return path.join(ROOT, 'src', 'content', ...segments);
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
        try {
          const raw = fs.readFileSync(full, 'utf-8');
          const parsed = matter(raw);
          entries.push({
            file: path.relative(contentDir(), full),
            data: parsed.data as Record<string, unknown>,
            content: parsed.content,
          });
        } catch {
          // Skip unparseable files
        }
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

function loadGovernanceConfig(): Record<string, unknown> {
  const configPath = path.join(ROOT, 'config', 'governance.yaml');
  if (fs.existsSync(configPath)) {
    return (YAML.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>) ?? {};
  }
  return {};
}

// Late phases where low confidence is a concern
const LATE_PHASES = ['creation', 'building'];
const LOW_CONFIDENCE = ['hypothesis'];

// Phase ordering for drift detection
const PHASE_ORDER: Record<string, number> = {
  discovery: 0,
  validation: 1,
  creation: 2,
  building: 3,
};

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function checkStaleness(thresholdDays: number): StaleItem[] {
  const definitions = readMarkdownFiles(contentDir('definitions'));
  const now = Date.now();
  const stale: StaleItem[] = [];

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

function checkOrphans(): GovernanceReport['orphans'] {
  const termSlugs = listSlugs(contentDir('terms'));
  const definitionDirs = listDirs(contentDir('definitions'));
  const definitions = readMarkdownFiles(contentDir('definitions'));

  const termsWithoutDefinitions = termSlugs.filter((slug) => !definitionDirs.includes(slug));

  const definitionsWithoutTerms: Array<{ file: string; term: string }> = [];
  for (const d of definitions) {
    const termRef = String(d.data.term ?? '');
    if (termRef && !termSlugs.includes(termRef)) {
      definitionsWithoutTerms.push({ file: d.file, term: termRef });
    }
  }

  return { termsWithoutDefinitions, definitionsWithoutTerms };
}

function checkCoverage(): GovernanceReport['coverage'] {
  const terms = readMarkdownFiles(contentDir('terms'));
  const definitions = readMarkdownFiles(contentDir('definitions'));

  const termsPerPhase: Record<string, number> = {};
  for (const t of terms) {
    const phase = String(t.data.custdev_phase ?? 'unknown');
    termsPerPhase[phase] = (termsPerPhase[phase] ?? 0) + 1;
  }

  const definitionsPerProduct: Record<string, number> = {};
  for (const d of definitions) {
    const product = String(d.data.product ?? 'global');
    definitionsPerProduct[product] = (definitionsPerProduct[product] ?? 0) + 1;
  }

  return { termsPerPhase, definitionsPerProduct };
}

function checkConfidenceDrift(): DriftItem[] {
  const definitions = readMarkdownFiles(contentDir('definitions'));
  const products = readMarkdownFiles(contentDir('products'));
  const drift: DriftItem[] = [];

  // Build product -> phase map
  const productPhaseMap: Record<string, string> = {};
  for (const p of products) {
    const slug = path.basename(p.file, '.md');
    productPhaseMap[slug] = String(p.data.custdev_phase ?? 'discovery');
  }

  for (const d of definitions) {
    const product = String(d.data.product ?? 'global');
    const confidence = String(d.data.confidence ?? '');

    if (product === 'global') continue;

    const productPhase = productPhaseMap[product];
    if (!productPhase) continue;

    // Flag definitions with low confidence in late-phase products
    if (LATE_PHASES.includes(productPhase) && LOW_CONFIDENCE.includes(confidence)) {
      drift.push({
        file: d.file,
        term: String(d.data.term ?? ''),
        product,
        productPhase,
        confidence,
      });
    }
  }

  return drift;
}

function checkBrevity(): BrevityItem[] {
  const definitions = readMarkdownFiles(contentDir('definitions'));
  const brief: BrevityItem[] = [];

  for (const d of definitions) {
    const bodyLength = d.content.trim().length;
    if (bodyLength < 200) {
      brief.push({
        file: d.file,
        term: String(d.data.term ?? ''),
        product: String(d.data.product ?? 'global'),
        charCount: bodyLength,
      });
    }
  }

  return brief;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const config = loadGovernanceConfig();
  const review = (config.review as Record<string, unknown>) ?? {};
  const thresholdDays = Number(review.staleness_threshold_days ?? 90);

  const report: GovernanceReport = {
    generatedAt: new Date().toISOString(),
    staleness: checkStaleness(thresholdDays),
    orphans: checkOrphans(),
    coverage: checkCoverage(),
    confidenceDrift: checkConfidenceDrift(),
    brevityWarnings: checkBrevity(),
  };

  // JSON report to stdout
  console.log(JSON.stringify(report, null, 2));

  // Human-readable summary to stderr
  const log = (msg: string) => process.stderr.write(msg + '\n');

  log('');
  log('=== Governance Quality Report ===');
  log(`Generated: ${report.generatedAt}`);
  log(`Staleness threshold: ${thresholdDays} days`);
  log('');

  // Staleness
  if (report.staleness.length > 0) {
    log(`STALENESS (${report.staleness.length} definitions):`);
    for (const s of report.staleness) {
      const age = s.daysSinceValidation !== null ? `${s.daysSinceValidation} days ago` : 'never validated';
      log(`  ${s.file}: ${s.term} (${s.product}) — last validated: ${age}`);
    }
    log('');
  } else {
    log('STALENESS: All definitions are up to date.');
    log('');
  }

  // Orphans
  const totalOrphans = report.orphans.termsWithoutDefinitions.length + report.orphans.definitionsWithoutTerms.length;
  if (totalOrphans > 0) {
    log(`ORPHANS (${totalOrphans} issues):`);
    for (const t of report.orphans.termsWithoutDefinitions) {
      log(`  Term without definitions: ${t}`);
    }
    for (const d of report.orphans.definitionsWithoutTerms) {
      log(`  Definition without term: ${d.file} (references "${d.term}")`);
    }
    log('');
  } else {
    log('ORPHANS: No orphaned content found.');
    log('');
  }

  // Coverage
  log('COVERAGE:');
  log('  Terms per phase:');
  for (const [phase, count] of Object.entries(report.coverage.termsPerPhase)) {
    log(`    ${phase}: ${count}`);
  }
  log('  Definitions per product:');
  for (const [product, count] of Object.entries(report.coverage.definitionsPerProduct)) {
    log(`    ${product}: ${count}`);
  }
  log('');

  // Confidence drift
  if (report.confidenceDrift.length > 0) {
    log(`CONFIDENCE DRIFT (${report.confidenceDrift.length} issues):`);
    for (const d of report.confidenceDrift) {
      log(`  ${d.file}: "${d.term}" in ${d.product} (phase: ${d.productPhase}) has confidence "${d.confidence}"`);
    }
    log('');
  } else {
    log('CONFIDENCE DRIFT: No drift detected.');
    log('');
  }

  // Brevity
  if (report.brevityWarnings.length > 0) {
    log(`BREVITY WARNINGS (${report.brevityWarnings.length} definitions under 200 chars):`);
    for (const b of report.brevityWarnings) {
      log(`  ${b.file}: ${b.term} (${b.product}) — ${b.charCount} characters`);
    }
    log('');
  } else {
    log('BREVITY: All definitions meet minimum length.');
    log('');
  }
}

main();
