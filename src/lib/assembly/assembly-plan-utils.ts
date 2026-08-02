import crypto from 'node:crypto';

export type PlannedFile = { path: string; content: string; sha256: string; source: 'accelerator' | 'project'; acceleratorSlug?: string; acceleratorVersion?: string };
export type PlanMetrics = { totalFiles: number; acceleratorFiles: number; totalLines: number; acceleratorLines: number; acceleratorReusePercent: number };
type AcceleratorInput = { slug: string; name: string; version: string; dependencies: string[]; targetStacks: string[]; conflictsWith: string[]; files: Array<{ path: string; content: string }> };

export function contentHash(content: string) { return crypto.createHash('sha256').update(content).digest('hex'); }
export function stableJson(value: unknown): string { if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`; if (value && typeof value === 'object') { const object = value as Record<string, unknown>; return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(',')}}`; } return JSON.stringify(value); }
export function immutableHash(value: unknown) { return crypto.createHash('sha256').update(stableJson(value)).digest('hex'); }
function lines(value: string) { return value === '' ? 0 : value.split(/\r?\n/).length; }
function isImplementationPath(filePath: string) { return /\.(?:[cm]?[jt]sx?|css|json|prisma|html|ya?ml)$/i.test(filePath) && !filePath.startsWith('docs/'); }

export function assemblePlanSnapshot(accelerators: AcceleratorInput[], projectFiles: Array<{ path: string; content: string }>) {
  const conflicts: string[] = []; const selected = new Set(accelerators.map((item) => item.slug)); const files = new Map<string, PlannedFile>();
  for (const accelerator of accelerators) {
    for (const conflict of accelerator.conflictsWith) if (selected.has(conflict)) conflicts.push(`${accelerator.slug} conflicts with ${conflict}`);
    for (const file of accelerator.files) {
      const existing = files.get(file.path);
      if (existing) { conflicts.push(`Both ${existing.acceleratorSlug} and ${accelerator.slug} write ${file.path}`); continue; }
      files.set(file.path, { path: file.path, content: file.content, sha256: contentHash(file.content), source: 'accelerator', acceleratorSlug: accelerator.slug, acceleratorVersion: accelerator.version });
    }
  }
  for (const file of projectFiles) {
    if (files.has(file.path)) conflicts.push(`Project documentation conflicts with accelerator file ${file.path}`);
    files.set(file.path, { path: file.path, content: file.content, sha256: contentHash(file.content), source: 'project' });
  }
  const plannedFiles = [...files.values()].sort((a, b) => a.path.localeCompare(b.path)); const acceleratorFiles = plannedFiles.filter((file) => file.source === 'accelerator');
  const implementationFiles = plannedFiles.filter((file) => isImplementationPath(file.path)); const acceleratorImplementationFiles = implementationFiles.filter((file) => file.source === 'accelerator');
  const totalLines = implementationFiles.reduce((total, file) => total + lines(file.content), 0); const acceleratorLines = acceleratorImplementationFiles.reduce((total, file) => total + lines(file.content), 0);
  const metrics: PlanMetrics = { totalFiles: implementationFiles.length, acceleratorFiles: acceleratorImplementationFiles.length, totalLines, acceleratorLines, acceleratorReusePercent: totalLines === 0 ? 0 : Math.round((acceleratorLines / totalLines) * 1000) / 10 };
  return { files: plannedFiles, metrics, conflicts: [...new Set(conflicts)].sort() };
}
