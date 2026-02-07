#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import YAML from 'yaml';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const CONFIG_DIR = path.join(ROOT, 'config');

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

function ask(rl: readline.Interface, question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('');
  console.log('=== CustDev Wiki Setup Wizard ===');
  console.log('');
  console.log('This wizard will create (or update) your initial configuration files.');
  console.log('Press Enter to accept the default value shown in brackets.');
  console.log('');

  try {
    // --- Prompts ---
    const companyName = await ask(rl, 'Company name', 'Your Company');
    const wikiTitle = await ask(rl, 'Wiki title', 'Product Wiki');
    const productName = await ask(rl, 'First product name', 'My Product');
    const productSlugDefault = slugify(productName);
    const productSlug = await ask(rl, 'Product slug', productSlugDefault);
    const adminUsername = await ask(rl, 'Admin username', 'admin');
    const adminPassword = await ask(rl, 'Admin password', 'admin');

    console.log('');
    console.log('Generating configuration files...');

    // --- site.yaml ---
    const sitePath = path.join(CONFIG_DIR, 'site.yaml');
    const site = loadYaml(sitePath) as Record<string, unknown>;

    const company = (site.company as Record<string, unknown>) ?? {};
    company.name = companyName;
    if (!company.logo) company.logo = '/assets/logo.svg';
    if (!company.tagline) company.tagline = 'What we know, how we know it, and why it matters';
    site.company = company;

    const wiki = (site.wiki as Record<string, unknown>) ?? {};
    wiki.title = wikiTitle;
    if (!wiki.base_url) wiki.base_url = 'http://localhost:4321';
    if (!wiki.default_language) wiki.default_language = 'en';
    if (!wiki.reading_level_target) wiki.reading_level_target = 8;
    site.wiki = wiki;

    if (!site.custdev) {
      site.custdev = {
        phases: [
          { slug: 'discovery', label: 'Customer Discovery', color: '#4A90D9', icon: 'magnifying-glass', default_confidence: 'hypothesis' },
          { slug: 'validation', label: 'Customer Validation', color: '#7B68EE', icon: 'clipboard-check', default_confidence: 'tested' },
          { slug: 'creation', label: 'Customer Creation', color: '#50C878', icon: 'megaphone', default_confidence: 'proven' },
          { slug: 'building', label: 'Company Building', color: '#FF8C00', icon: 'building', default_confidence: 'canonical' },
        ],
      };
    }

    if (!site.cms) {
      site.cms = { enabled: true, backend: 'local', editorial_workflow: true };
    }

    saveYaml(sitePath, site);
    console.log(`  Created: ${path.relative(ROOT, sitePath)}`);

    // --- products.yaml ---
    const productsPath = path.join(CONFIG_DIR, 'products.yaml');
    const productsConfig = loadYaml(productsPath) as Record<string, unknown>;
    const products = (productsConfig.products as Array<Record<string, unknown>>) ?? [];

    const existing = products.find((p) => p.slug === productSlug);
    if (!existing) {
      products.push({
        slug: productSlug,
        name: productName,
        description: `${productName} product`,
        status: 'active',
        team: {
          lead: `${adminUsername}@localhost`,
          members: [],
        },
        custdev_phase: 'discovery',
      });
    }
    productsConfig.products = products;
    saveYaml(productsPath, productsConfig);
    console.log(`  Created: ${path.relative(ROOT, productsPath)}`);

    // --- auth.yaml ---
    const authPath = path.join(CONFIG_DIR, 'auth.yaml');
    const authConfig = loadYaml(authPath) as Record<string, unknown>;

    const auth = (authConfig.auth as Record<string, unknown>) ?? {};
    if (!auth.provider) auth.provider = 'local';

    const local = (auth.local as Record<string, unknown>) ?? {};
    const users = (local.users as Array<Record<string, unknown>>) ?? [];

    const existingAdmin = users.find((u) => u.username === adminUsername);
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin) {
      existingAdmin.password_hash = passwordHash;
    } else {
      users.push({
        username: adminUsername,
        password_hash: passwordHash,
        email: `${adminUsername}@localhost`,
        role: 'admin',
      });
    }

    local.users = users;
    auth.local = local;

    if (!auth.jwt) {
      auth.jwt = {
        secret_env_var: 'JWT_SECRET',
        expires_in: '8h',
        cookie_name: 'wiki_session',
      };
    }

    authConfig.auth = auth;
    saveYaml(authPath, authConfig);
    console.log(`  Created: ${path.relative(ROOT, authPath)}`);

    // --- teams.yaml ---
    const teamsPath = path.join(CONFIG_DIR, 'teams.yaml');
    const teamsConfig = loadYaml(teamsPath) as Record<string, unknown>;

    if (!teamsConfig.roles) {
      teamsConfig.roles = [
        { slug: 'admin', permissions: ['propose', 'review', 'approve', 'publish', 'configure'] },
        { slug: 'product-lead', permissions: ['propose', 'review', 'approve', 'publish'], scope: 'own-products' },
        { slug: 'term-owner', permissions: ['propose', 'review', 'approve', 'publish'], scope: 'own-terms' },
        { slug: 'editor', permissions: ['propose', 'review'] },
        { slug: 'contributor', permissions: ['propose'] },
      ];
    }

    const people = (teamsConfig.people as Array<Record<string, unknown>>) ?? [];
    const existingPerson = people.find((p) => p.email === `${adminUsername}@localhost`);
    if (!existingPerson) {
      people.push({
        name: `${adminUsername.charAt(0).toUpperCase()}${adminUsername.slice(1)} User`,
        email: `${adminUsername}@localhost`,
        role: 'admin',
      });
    }
    teamsConfig.people = people;
    saveYaml(teamsPath, teamsConfig);
    console.log(`  Created: ${path.relative(ROOT, teamsPath)}`);

    console.log('');
    console.log('Setup complete! You can now run:');
    console.log(`  npm run scaffold:product ${productSlug}   — create product content files`);
    console.log('  npm run dev                              — start the dev server');
    console.log('');
  } catch (err) {
    console.error('Setup failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
