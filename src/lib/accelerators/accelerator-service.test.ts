import { describe, expect, it } from 'vitest';
import { getAccelerator, listAccelerators, hashAcceleratorFile } from '@/src/lib/accelerators/accelerator-service';

describe('approved accelerator catalogue', () => {
  it('only exposes valid versioned manifests', async () => {
    const accelerators = await listAccelerators();
    expect(accelerators.length).toBeGreaterThanOrEqual(5);
    expect(accelerators.every((accelerator) => /^\d+\.\d+\.\d+$/.test(accelerator.version))).toBe(true);
    expect(accelerators.every((accelerator) => accelerator.targetStacks.includes('nextjs-14'))).toBe(true);
  });

  it('loads a reproducible file snapshot for an accelerator', async () => {
    const accelerator = await getAccelerator('pwa-shell');
    expect(accelerator).not.toBeNull();
    expect(accelerator?.version).toBe('1.0.0');
    expect(accelerator?.files.length).toBeGreaterThan(0);
    expect(accelerator?.files.every((file) => /^[a-f0-9]{64}$/.test(hashAcceleratorFile(file.content)))).toBe(true);
  });
});
