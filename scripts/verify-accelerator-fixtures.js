/*
 * Proves that the accelerator catalogue can create a real, compiling Next.js
 * workspace. It deliberately uses the repository's installed dependencies so
 * verification is deterministic and does not install packages or use a network.
 */
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(__dirname, '..');
const acceleratorRoot = path.join(repositoryRoot, 'accelerators');
const fixtures = [
  ['nextjs-app-baseline'],
  ['nextjs-app-baseline', 'prisma-postgres-starter', 'pwa-shell', 'cookie-session-auth', 'ai-provider-wrapper-gemini', 'digital-clock-triangles'],
];

async function copyFiles(source, destination, owners) {
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyFiles(sourcePath, targetPath, owners);
      continue;
    }
    const relative = path.relative(destination, targetPath);
    if (owners.has(targetPath)) throw new Error(`File collision: ${relative} is owned by ${owners.get(targetPath)} and ${source}`);
    owners.set(targetPath, source);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
}

async function verifyFixture(slugs) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'eolas-accelerator-fixture-'));
  const owners = new Map();
  for (const slug of slugs) {
    const files = path.join(acceleratorRoot, slug, 'files');
    await copyFiles(files, workspace, owners);
  }
  await fs.symlink(path.join(repositoryRoot, 'node_modules'), path.join(workspace, 'node_modules'));
  await execFileAsync('npm', ['run', 'build'], { cwd: workspace, maxBuffer: 10 * 1024 * 1024 });
  console.log(`✓ ${slugs.join(' + ')}`);
}

async function main() {
  for (const fixture of fixtures) await verifyFixture(fixture);
}

main().catch((error) => {
  console.error(error.stderr || error.message || error);
  process.exitCode = 1;
});
