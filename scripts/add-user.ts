#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const VALID_ROLES = ['admin', 'editor', 'contributor'];

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

function parseArgs(argv: string[]): { username: string; password: string; email: string; role: string } {
  const args = argv.slice(2);
  let username = '';
  let password = '';
  let email = '';
  let role = 'contributor';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--username':
        username = next ?? '';
        i++;
        break;
      case '--password':
        password = next ?? '';
        i++;
        break;
      case '--email':
        email = next ?? '';
        i++;
        break;
      case '--role':
        role = next ?? 'contributor';
        i++;
        break;
    }
  }

  return { username, password, email, role };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { username, password, email, role } = parseArgs(process.argv);

  // Validate inputs
  const errors: string[] = [];
  if (!username) errors.push('--username is required');
  if (!password) errors.push('--password is required');
  if (!email) errors.push('--email is required');
  if (!VALID_ROLES.includes(role)) errors.push(`--role must be one of: ${VALID_ROLES.join(', ')}`);

  if (errors.length > 0) {
    console.error('Usage: npm run auth:add-user -- --username <name> --password <pass> --email <email> [--role <role>]');
    console.error('');
    console.error('Errors:');
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    console.error('');
    console.error(`Valid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  // Load auth config
  const authPath = path.join(ROOT, 'config', 'auth.yaml');
  const authConfig = loadYaml(authPath);
  const auth = (authConfig.auth as Record<string, unknown>) ?? {};
  if (!auth.provider) auth.provider = 'local';

  const local = (auth.local as Record<string, unknown>) ?? {};
  const users = (local.users as Array<Record<string, unknown>>) ?? [];

  // Check for duplicate username
  const existing = users.find((u) => u.username === username);
  if (existing) {
    console.error(`Error: User "${username}" already exists in config/auth.yaml.`);
    console.error('To update an existing user, edit config/auth.yaml directly or remove the user first.');
    process.exit(1);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Add user
  users.push({
    username,
    password_hash: passwordHash,
    email,
    role,
  });

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

  console.log('');
  console.log(`User "${username}" added successfully.`);
  console.log(`  Email: ${email}`);
  console.log(`  Role:  ${role}`);
  console.log(`  File:  config/auth.yaml`);
  console.log('');
}

main();
