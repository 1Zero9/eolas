import { describe, expect, it } from 'vitest';
import { assemblePlanSnapshot, immutableHash } from '@/src/lib/assembly/assembly-plan-utils';

const base = { name: 'Base', version: '1.0.0', dependencies: [], targetStacks: ['nextjs-14'], conflictsWith: [] };

describe('accelerator composition', () => {
  it('creates a deterministic hashable snapshot with explicit reuse coverage', () => {
    const result = assemblePlanSnapshot([{ ...base, slug: 'base', files: [{ path: 'src/app/page.tsx', content: 'export default function Page() {}' }] }], [{ path: 'docs/idea.md', content: 'Original idea' }]);
    expect(result.conflicts).toEqual([]);
    expect(result.metrics).toMatchObject({ totalFiles: 1, acceleratorFiles: 1, acceleratorReusePercent: 100 });
    expect(immutableHash(result)).toBe(immutableHash(result));
    expect(result.files[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('refuses silent file ownership collisions', () => {
    const result = assemblePlanSnapshot([
      { ...base, slug: 'one', files: [{ path: 'src/lib/auth.ts', content: 'one' }] },
      { ...base, slug: 'two', files: [{ path: 'src/lib/auth.ts', content: 'two' }] },
    ], []);
    expect(result.conflicts).toEqual(['Both one and two write src/lib/auth.ts']);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].content).toBe('one');
  });
});
