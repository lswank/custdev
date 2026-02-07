#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseArgs(argv: string[]): { slug: string; product?: string } {
  const args = argv.slice(2);
  let slug = '';
  let product: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--product' && args[i + 1]) {
      product = args[i + 1];
      i++; // skip next
    } else if (!args[i].startsWith('--')) {
      slug = args[i];
    }
  }

  return { slug, product };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { slug, product } = parseArgs(process.argv);

  if (!slug) {
    console.error('Usage: npm run scaffold:term <slug> [--product <product-slug>]');
    console.error('');
    console.error('Examples:');
    console.error('  npm run scaffold:term conversion-rate');
    console.error('  npm run scaffold:term conversion-rate --product quickbite');
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const created: string[] = [];
  const skipped: string[] = [];

  // --- Create src/content/terms/{slug}.md ---
  const termPath = path.join(ROOT, 'src', 'content', 'terms', `${slug}.md`);
  if (fs.existsSync(termPath)) {
    skipped.push(`src/content/terms/${slug}.md (already exists)`);
  } else {
    ensureDir(path.dirname(termPath));
    const termTemplate = `---
name: "${titleCase(slug)}"
aliases: []
custdev_phase: "discovery"
owner: ""
created: ${today}
status: "draft"
---

## Overview

Describe what ${titleCase(slug)} means in plain language.

## Why This Matters

Explain why this term is important and how it connects to customer development.
`;

    fs.writeFileSync(termPath, termTemplate, 'utf-8');
    created.push(`src/content/terms/${slug}.md`);
  }

  // --- Create src/content/definitions/{slug}/global.md ---
  const globalDefPath = path.join(ROOT, 'src', 'content', 'definitions', slug, 'global.md');
  if (fs.existsSync(globalDefPath)) {
    skipped.push(`src/content/definitions/${slug}/global.md (already exists)`);
  } else {
    ensureDir(path.dirname(globalDefPath));
    const globalTemplate = `---
term: ${slug}
product: global
custdev_phase: "discovery"
confidence: "hypothesis"
version: "1.0.0"
owner: ""
method: ""
status: "draft"
last_validated: ${today}
---

Write the global (company-wide) definition of ${titleCase(slug)} here.
`;

    fs.writeFileSync(globalDefPath, globalTemplate, 'utf-8');
    created.push(`src/content/definitions/${slug}/global.md`);
  }

  // --- Optionally create src/content/definitions/{slug}/{product}.md ---
  if (product) {
    const productDefPath = path.join(ROOT, 'src', 'content', 'definitions', slug, `${product}.md`);
    if (fs.existsSync(productDefPath)) {
      skipped.push(`src/content/definitions/${slug}/${product}.md (already exists)`);
    } else {
      ensureDir(path.dirname(productDefPath));
      const productTemplate = `---
term: ${slug}
product: ${product}
custdev_phase: "discovery"
confidence: "hypothesis"
version: "1.0.0"
owner: ""
method: ""
status: "draft"
override_reason: ""
last_validated: ${today}
---

Write the ${titleCase(product)}-specific definition of ${titleCase(slug)} here. Explain how this product's usage differs from the global definition.
`;

      fs.writeFileSync(productDefPath, productTemplate, 'utf-8');
      created.push(`src/content/definitions/${slug}/${product}.md`);
    }
  }

  // --- Output summary ---
  console.log('');
  console.log(`Scaffold term: ${slug}`);
  console.log('');

  if (created.length > 0) {
    console.log('Created:');
    for (const f of created) {
      console.log(`  + ${f}`);
    }
  }

  if (skipped.length > 0) {
    console.log('Skipped (already exist):');
    for (const f of skipped) {
      console.log(`  - ${f}`);
    }
  }

  console.log('');
}

main();
