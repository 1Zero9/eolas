const fs = require('node:fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('node:crypto');

const BASE_URL = process.env.EOLAS_CLOUD_URL || 'http://localhost:3000';
const PROJECT_ROOT = path.resolve(process.env.EOLAS_PROJECT_ROOT || path.join(os.homedir(), 'Projects'));
const WORKER_SECRET = process.env.EOLAS_WORKER_SECRET;

const IGNORED_DIRS = new Set(['node_modules', '.next', '.git', 'out', 'dist', 'build', '.vercel']);
const MAX_FILE_BYTES = 20000;
const MAX_FILES_PER_REPO = 8;

const PATTERN_MATCHERS = [
  /(^|\/)auth\.ts$/,
  /(^|\/)middleware\.ts$/,
  /(^|\/)worker-auth\.ts$/,
  /(^|\/)docker-compose\.ya?ml$/,
  /(^|\/)Dockerfile$/,
  /^\.github\/workflows\/.+\.ya?ml$/,
  /(^|\/)next\.config\.(js|mjs|ts)$/,
  /(^|\/)tailwind\.config\.(js|ts)$/,
  /(^|\/)prisma\/schema\.prisma$/,
];

if (typeof globalThis.fetch !== 'function') {
  throw new Error('This script requires Node 18+ with built-in fetch support.');
}

if (!WORKER_SECRET) {
  throw new Error(
    "EOLAS_WORKER_SECRET is not set. Set it to the same value as the cloud app's EOLAS_WORKER_SECRET env var.",
  );
}

async function findGitRepos(root) {
  const repos = [];

  async function walk(dir, depth) {
    if (depth > 4) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    if (entries.some((entry) => entry.isDirectory() && entry.name === '.git')) {
      repos.push(dir);
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      await walk(path.join(dir, entry.name), depth + 1);
    }
  }

  await walk(root, 0);
  return repos;
}

async function collectFiles(repoDir) {
  const matches = [];

  async function walk(dir, depth) {
    if (matches.length >= MAX_FILES_PER_REPO || depth > 5) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (matches.length >= MAX_FILES_PER_REPO) return;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(repoDir, fullPath);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        await walk(fullPath, depth + 1);
        continue;
      }

      if (PATTERN_MATCHERS.some((pattern) => pattern.test(relativePath))) {
        try {
          const stat = await fs.stat(fullPath);
          if (stat.size > MAX_FILE_BYTES) continue;
          const content = await fs.readFile(fullPath);
          matches.push({
            path: relativePath,
            bytes: stat.size,
            sha256: crypto.createHash('sha256').update(content).digest('hex'),
          });
        } catch {
          continue;
        }
      }
    }
  }

  await walk(repoDir, 0);
  return matches;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log(`Scanning ${PROJECT_ROOT} for repos...`);
  const repos = await findGitRepos(PROJECT_ROOT);
  console.log(`Found ${repos.length} git repo(s).`);

  const candidates = [];

  for (const repoDir of repos) {
    const files = await collectFiles(repoDir);
    if (files.length === 0) continue;

    const name = path.basename(repoDir);
    candidates.push({
      name,
      slug: slugify(name),
      description: `Patterns discovered in ${name} (${files.length} matching file(s)).`,
      category: 'discovered',
      capabilities: files.map((file) => file.path),
      files,
    });
  }

  console.log(`${candidates.length} repo(s) had matching patterns.`);

  if (candidates.length === 0) {
    console.log('Nothing to send.');
    return;
  }

  const response = await globalThis.fetch(`${BASE_URL}/api/accelerators/discover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-worker-secret': WORKER_SECRET,
    },
    body: JSON.stringify({ candidates }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Discover request failed: HTTP ${response.status} ${text}`);
  }

  const result = await response.json();
  console.log(`Created ${result.created} new candidate(s), skipped ${result.skipped} already-known slug(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
