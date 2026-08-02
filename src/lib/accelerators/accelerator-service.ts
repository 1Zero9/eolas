import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/src/lib/db';

export type AcceleratorFile = { path: string; content: string };

export type AcceleratorManifest = {
  name: string;
  version: string;
  description?: string;
  category: string;
  capabilities?: string[];
  provides?: string[];
  conflictsWith?: string[];
  targetStacks?: string[];
  dependencies?: string[];
};

export type AcceleratorSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  version: string;
  capabilities: string[];
  provides: string[];
  conflictsWith: string[];
  targetStacks: string[];
  dependencies: string[];
};

export type AcceleratorWithFiles = AcceleratorSummary & { files: AcceleratorFile[] };

const ACCELERATORS_ROOT = path.join(process.cwd(), 'accelerators');

const acceleratorManifestSchema = z.object({
  name: z.string().trim().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'version must use semantic versioning (for example 1.0.0)'),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1),
  capabilities: z.array(z.string().trim().min(1)).default([]),
  provides: z.array(z.string().trim().min(1)).default([]),
  conflictsWith: z.array(z.string().trim().min(1)).default([]),
  targetStacks: z.array(z.string().trim().min(1)).default([]),
  dependencies: z.array(z.string().trim().min(1)).default([]),
});

function readManifest(slug: string): AcceleratorManifest | null {
  const manifestPath = path.join(ACCELERATORS_ROOT, slug, 'accelerator.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return acceleratorManifestSchema.parse(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
  } catch {
    return null;
  }
}

function walkFiles(dir: string, baseDir: string): AcceleratorFile[] {
  const results: AcceleratorFile[] = [];
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath).split(path.sep).join('/');
      results.push({ path: relativePath, content: fs.readFileSync(fullPath, 'utf8') });
    }
  }

  return results;
}

function listAcceleratorSlugs(): string[] {
  try {
    return fs
      .readdirSync(ACCELERATORS_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

// Approved catalogue: git is the source of truth. Every accelerator is a real,
// version-controlled folder at accelerators/<slug>/ with a manifest + files/.
export async function listAccelerators(): Promise<AcceleratorSummary[]> {
  const accelerators = listAcceleratorSlugs()
    .map((slug) => {
      const manifest = readManifest(slug);
      if (!manifest) return null;
      return {
        id: slug,
        slug,
        name: manifest.name,
        description: manifest.description ?? null,
        category: manifest.category,
        version: manifest.version,
        capabilities: manifest.capabilities ?? [],
        provides: manifest.provides ?? [],
        conflictsWith: manifest.conflictsWith ?? [],
        targetStacks: manifest.targetStacks ?? [],
        dependencies: manifest.dependencies ?? [],
      };
    })
    .filter((accelerator): accelerator is AcceleratorSummary => accelerator !== null);

  return accelerators.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAccelerator(slug: string): Promise<AcceleratorWithFiles | null> {
  const manifest = readManifest(slug);
  if (!manifest) return null;

  const filesDir = path.join(ACCELERATORS_ROOT, slug, 'files');
  const files = walkFiles(filesDir, filesDir);

  return {
    id: slug,
    slug,
    name: manifest.name,
    description: manifest.description ?? null,
    category: manifest.category,
    version: manifest.version,
    capabilities: manifest.capabilities ?? [],
    provides: manifest.provides ?? [],
    conflictsWith: manifest.conflictsWith ?? [],
    targetStacks: manifest.targetStacks ?? [],
    dependencies: manifest.dependencies ?? [],
    files,
  };
}

export function hashAcceleratorFile(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function getAcceleratorsByIds(ids: string[]): Promise<AcceleratorWithFiles[]> {
  if (!ids.length) return [];
  const results = await Promise.all(ids.map((id) => getAccelerator(id)));
  return results.filter((accelerator): accelerator is AcceleratorWithFiles => accelerator !== null);
}

// Discovered accelerators are staging candidates found by scanning local repos.
// They live in Postgres (with their file content) until someone reviews them and
// turns them into a real accelerators/<slug>/ folder in git.
export async function listDiscoveredAccelerators() {
  return prisma.accelerator.findMany({ where: { status: 'DISCOVERED' }, orderBy: { createdAt: 'desc' } });
}

export async function listRecentAccelerators(limit = 25) {
  return prisma.accelerator.findMany({
    where: { status: 'DISCOVERED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export type DiscoveredAcceleratorInput = {
  name: string;
  slug: string;
  description?: string;
  category: string;
  capabilities?: string[];
  // Discovery records metadata only. Source code remains on the local machine
  // until a human deliberately creates a reviewed Git accelerator.
  files: Array<{ path: string; bytes?: number; sha256?: string }>;
};

export async function upsertDiscoveredAccelerators(candidates: DiscoveredAcceleratorInput[]) {
  const results = [];

  for (const candidate of candidates) {
    const existing = await prisma.accelerator.findUnique({ where: { slug: candidate.slug } });

    if (existing) {
      continue;
    }

    const created = await prisma.accelerator.create({
      data: {
        name: candidate.name,
        slug: candidate.slug,
        description: candidate.description,
        category: candidate.category,
        capabilities: candidate.capabilities || [],
        files: candidate.files,
        status: 'DISCOVERED',
      },
    });

    results.push(created);
  }

  return results;
}

export async function setAcceleratorStatus(id: string, status: 'APPROVED' | 'DISMISSED') {
  return prisma.accelerator.update({ where: { id }, data: { status } });
}
