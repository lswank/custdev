#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidationIssue {
  level: 'error' | 'warning';
  file: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

function contentDir(...segments: string[]): string {
  return path.join(ROOT, 'src', 'content', ...segments);
}

function readMarkdownFiles(dir: string): Array<{ file: string; relPath: string; data: Record<string, unknown>; content: string }> {
  if (!fs.existsSync(dir)) return [];
  const entries: Array<{ file: string; relPath: string; data: Record<string, unknown>; content: string }> = [];

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
            file: full,
            relPath: path.relative(path.join(ROOT, 'src', 'content'), full),
            data: parsed.data as Record<string, unknown>,
            content: parsed.content,
          });
        } catch (err) {
          entries.push({
            file: full,
            relPath: path.relative(path.join(ROOT, 'src', 'content'), full),
            data: {},
            content: '',
          });
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

function hasField(data: Record<string, unknown>, field: string): boolean {
  return field in data && data[field] !== undefined && data[field] !== null && data[field] !== '';
}

// ---------------------------------------------------------------------------
// Validation checks
// ---------------------------------------------------------------------------

function validateTerms(issues: ValidationIssue[]): void {
  const requiredFields = ['name', 'custdev_phase', 'owner', 'status'];
  const terms = readMarkdownFiles(contentDir('terms'));

  for (const term of terms) {
    // Check frontmatter parse
    if (Object.keys(term.data).length === 0 && term.content === '') {
      issues.push({ level: 'error', file: term.relPath, message: 'Failed to parse frontmatter' });
      continue;
    }

    // Check required fields
    for (const field of requiredFields) {
      if (!hasField(term.data, field)) {
        issues.push({ level: 'error', file: term.relPath, message: `Missing required field: ${field}` });
      }
    }
  }
}

function validateDefinitions(issues: ValidationIssue[]): void {
  const requiredFields = ['term', 'product', 'custdev_phase', 'confidence', 'version', 'owner', 'method', 'status'];
  const definitions = readMarkdownFiles(contentDir('definitions'));
  const termSlugs = listSlugs(contentDir('terms'));
  const methodSlugs = listSlugs(contentDir('methods'));
  const productSlugs = listSlugs(contentDir('products'));

  for (const def of definitions) {
    // Check frontmatter parse
    if (Object.keys(def.data).length === 0 && def.content === '') {
      issues.push({ level: 'error', file: def.relPath, message: 'Failed to parse frontmatter' });
      continue;
    }

    // Check required fields
    for (const field of requiredFields) {
      if (!hasField(def.data, field)) {
        issues.push({ level: 'error', file: def.relPath, message: `Missing required field: ${field}` });
      }
    }

    // Check term reference
    const termRef = String(def.data.term ?? '');
    if (termRef && !termSlugs.includes(termRef)) {
      issues.push({
        level: 'error',
        file: def.relPath,
        message: `Term reference "${termRef}" does not match any file in terms/`,
      });
    }

    // Check method reference
    const methodRef = String(def.data.method ?? '');
    if (methodRef && !methodSlugs.includes(methodRef)) {
      issues.push({
        level: 'warning',
        file: def.relPath,
        message: `Method reference "${methodRef}" does not match any file in methods/`,
      });
    }

    // Check product reference
    const productRef = String(def.data.product ?? '');
    if (productRef && productRef !== 'global' && !productSlugs.includes(productRef)) {
      issues.push({
        level: 'warning',
        file: def.relPath,
        message: `Product reference "${productRef}" does not match any file in products/`,
      });
    }
  }
}

function validateOrphans(issues: ValidationIssue[]): void {
  const termSlugs = listSlugs(contentDir('terms'));
  const definitionDirs = listDirs(contentDir('definitions'));
  const definitions = readMarkdownFiles(contentDir('definitions'));

  // Definitions directories without matching term files
  for (const dir of definitionDirs) {
    if (!termSlugs.includes(dir)) {
      issues.push({
        level: 'warning',
        file: `definitions/${dir}/`,
        message: `Orphaned definition directory: no matching term file "terms/${dir}.md" found`,
      });
    }
  }

  // Definition term references that do not match any term file
  // (Already covered in validateDefinitions, but we also check dir-level orphans above)
}

function validateMethods(issues: ValidationIssue[]): void {
  const requiredFields = ['name', 'method_type', 'confidence_level'];
  const methods = readMarkdownFiles(contentDir('methods'));

  for (const method of methods) {
    if (Object.keys(method.data).length === 0 && method.content === '') {
      issues.push({ level: 'error', file: method.relPath, message: 'Failed to parse frontmatter' });
      continue;
    }

    for (const field of requiredFields) {
      if (!hasField(method.data, field)) {
        issues.push({ level: 'error', file: method.relPath, message: `Missing required field: ${field}` });
      }
    }
  }
}

function validateProducts(issues: ValidationIssue[]): void {
  const requiredFields = ['name', 'description', 'status', 'custdev_phase'];
  const products = readMarkdownFiles(contentDir('products'));

  for (const product of products) {
    if (Object.keys(product.data).length === 0 && product.content === '') {
      issues.push({ level: 'error', file: product.relPath, message: 'Failed to parse frontmatter' });
      continue;
    }

    for (const field of requiredFields) {
      if (!hasField(product.data, field)) {
        issues.push({ level: 'error', file: product.relPath, message: `Missing required field: ${field}` });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('');
  console.log('=== CustDev Wiki Content Validation ===');
  console.log('');

  const issues: ValidationIssue[] = [];

  validateTerms(issues);
  validateDefinitions(issues);
  validateOrphans(issues);
  validateMethods(issues);
  validateProducts(issues);

  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  if (issues.length === 0) {
    console.log('All content files are valid. No issues found.');
    console.log('');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log(`ERRORS (${errors.length}):`);
    for (const e of errors) {
      console.log(`  [ERROR] ${e.file}: ${e.message}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`WARNINGS (${warnings.length}):`);
    for (const w of warnings) {
      console.log(`  [WARN]  ${w.file}: ${w.message}`);
    }
    console.log('');
  }

  console.log(`Summary: ${errors.length} error(s), ${warnings.length} warning(s)`);
  console.log('');

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
