#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadYaml(filepath: string): Record<string, unknown> {
  if (fs.existsSync(filepath)) {
    const raw = fs.readFileSync(filepath, 'utf-8');
    return (YAML.parse(raw) as Record<string, unknown>) ?? {};
  }
  return {};
}

function saveYaml(filepath: string, data: unknown): void {
  ensureDir(path.dirname(filepath));
  fs.writeFileSync(filepath, YAML.stringify(data, { lineWidth: 120 }), 'utf-8');
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const slug = process.argv[2];

  if (!slug) {
    console.error('Usage: npm run scaffold:product <slug>');
    console.error('');
    console.error('Example: npm run scaffold:product my-new-app');
    process.exit(1);
  }

  const created: string[] = [];
  const skipped: string[] = [];

  // --- Update config/products.yaml ---
  const productsPath = path.join(ROOT, 'config', 'products.yaml');
  const productsConfig = loadYaml(productsPath);
  const products = (productsConfig.products as Array<Record<string, unknown>>) ?? [];

  const existing = products.find((p) => p.slug === slug);
  if (existing) {
    skipped.push(`config/products.yaml (product "${slug}" already exists)`);
  } else {
    products.push({
      slug,
      name: titleCase(slug),
      description: `${titleCase(slug)} product`,
      status: 'active',
      team: {
        lead: '',
        members: [],
      },
      custdev_phase: 'discovery',
    });
    productsConfig.products = products;
    saveYaml(productsPath, productsConfig);
    created.push(`config/products.yaml (added product "${slug}")`);
  }

  // --- Create src/content/products/{slug}.md ---
  const productContentPath = path.join(ROOT, 'src', 'content', 'products', `${slug}.md`);
  if (fs.existsSync(productContentPath)) {
    skipped.push(`src/content/products/${slug}.md (already exists)`);
  } else {
    ensureDir(path.dirname(productContentPath));
    const today = new Date().toISOString().slice(0, 10);
    const template = `---
name: "${titleCase(slug)}"
description: "Description for ${titleCase(slug)}"
team_members: []
status: "active"
custdev_phase: "discovery"
---

## Overview

Describe what ${titleCase(slug)} is and the problem it solves.

## Current Phase: Customer Discovery

${titleCase(slug)} is in the Customer Discovery phase. Document the key questions you are trying to answer.

## Team

List the team members working on ${titleCase(slug)}.
`;

    fs.writeFileSync(productContentPath, template, 'utf-8');
    created.push(`src/content/products/${slug}.md`);
  }

  // --- Output summary ---
  console.log('');
  console.log(`Scaffold product: ${slug}`);
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
