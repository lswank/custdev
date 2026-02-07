import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPO_ROOT = process.cwd();

function ensureAuth(locals: App.Locals): Response | null {
  if (!locals.user || !['admin', 'editor'].includes(locals.user.role)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

function listFiles(dir: string, base = ''): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFiles(path.join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

function gitCommit(filepath: string, message: string, author: string) {
  try {
    execSync(`git add "${filepath}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
    execSync(
      `git -c user.name="${author}" -c user.email="${author}@localhost" commit -m "${message}"`,
      { cwd: REPO_ROOT, stdio: 'pipe' }
    );
  } catch {
    // Non-fatal: commit may fail if nothing changed
  }
}

export const ALL: APIRoute = async ({ params, request, locals }) => {
  const authError = ensureAuth(locals);
  if (authError) return authError;

  const routePath = params.path || '';
  const method = request.method;
  const username = locals.user?.username || 'anonymous';

  // Root endpoint — CMS handshake
  if (!routePath && method === 'GET') {
    return new Response(JSON.stringify({ repo: 'local', type: 'local' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // List entries in a collection folder
  if (routePath === 'entriesByFolder' && method === 'POST') {
    const body = await request.json();
    const folder = body.folder as string;
    const extension = body.extension || 'md';
    const folderPath = path.join(REPO_ROOT, folder);

    const files = listFiles(folderPath).filter((f) => f.endsWith(`.${extension}`));

    const entries = files.map((file) => {
      const fullPath = path.join(folderPath, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      return {
        path: `${folder}/${file}`,
        slug: file.replace(`.${extension}`, ''),
        data: content,
      };
    });

    return new Response(JSON.stringify(entries), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read a single entry
  if (routePath === 'entriesByFiles' && method === 'POST') {
    const body = await request.json();
    const paths = body.paths as string[];

    const entries = paths
      .map((p: string) => {
        const fullPath = path.join(REPO_ROOT, p);
        if (!fs.existsSync(fullPath)) return null;
        const content = fs.readFileSync(fullPath, 'utf-8');
        return {
          path: p,
          slug: path.basename(p, path.extname(p)),
          data: content,
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify(entries), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create or update an entry
  if (routePath === 'entry' && method === 'POST') {
    const body = await request.json();
    const entryPath = body.path as string;
    const content = body.raw as string;
    const fullPath = path.join(REPO_ROOT, entryPath);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');

    const isNew = body.newEntry;
    const message = isNew
      ? `Create ${entryPath} via CMS`
      : `Update ${entryPath} via CMS`;
    gitCommit(entryPath, message, username);

    return new Response(JSON.stringify({ path: entryPath }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Delete an entry
  if (routePath === 'entry' && method === 'DELETE') {
    const body = await request.json();
    const entryPath = body.path as string;
    const fullPath = path.join(REPO_ROOT, entryPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      gitCommit(entryPath, `Delete ${entryPath} via CMS`, username);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Media upload
  if (routePath === 'media' && method === 'POST') {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file' }), { status: 400 });
    }

    const mediaDir = path.join(REPO_ROOT, 'public', 'media');
    fs.mkdirSync(mediaDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(mediaDir, file.name);
    fs.writeFileSync(filePath, buffer);

    gitCommit(`public/media/${file.name}`, `Upload ${file.name} via CMS`, username);

    return new Response(
      JSON.stringify({ path: `/media/${file.name}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Media list
  if (routePath === 'media' && method === 'GET') {
    const mediaDir = path.join(REPO_ROOT, 'public', 'media');
    if (!fs.existsSync(mediaDir)) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const files = fs.readdirSync(mediaDir).filter((f) => !f.startsWith('.'));
    const media = files.map((f) => ({
      path: `/media/${f}`,
      name: f,
    }));

    return new Response(JSON.stringify(media), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Not found', path: routePath }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};
