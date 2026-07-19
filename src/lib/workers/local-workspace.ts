import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const DEFAULT_GITIGNORE = ['node_modules', '.DS_Store', '.next', 'dist', 'out', 'npm-debug.log'].join('\n');

function assertAbsolutePath(value: string, name: string) {
  if (!path.isAbsolute(value)) {
    throw new Error(`${name} must be an absolute path`);
  }
}

function ensureSafeSubpath(root: string, target: string) {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(target);
  const relative = path.relative(normalizedRoot, normalizedTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Target location is outside the allowed project root');
  }

  return normalizedTarget;
}

export async function createLocalWorkspace(options: {
  allowedProjectRoot: string;
  projectSlug: string;
  projectName: string;
  projectId?: string;
  files: Array<{ path: string; content: string }>;
  initialiseGit?: boolean;
}) {
  assertAbsolutePath(options.allowedProjectRoot, 'allowedProjectRoot');

  const rootPath = ensureSafeSubpath(
    options.allowedProjectRoot,
    path.resolve(options.allowedProjectRoot, options.projectSlug),
  );

  await fs.mkdir(rootPath, { recursive: true });

  for (const file of options.files) {
    const normalizedFilePath = path.normalize(file.path);
    const targetPath = ensureSafeSubpath(rootPath, path.resolve(rootPath, normalizedFilePath));
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, file.content ?? '', 'utf8');
  }

  const metadata = {
    projectId: options.projectId,
    projectName: options.projectName,
    projectSlug: options.projectSlug,
    createdAt: new Date().toISOString(),
  };

  const projectConfigPath = path.join(rootPath, '.eolas');
  await fs.mkdir(projectConfigPath, { recursive: true });
  await fs.writeFile(path.join(projectConfigPath, 'project.json'), JSON.stringify(metadata, null, 2), 'utf8');
  await fs.writeFile(path.join(rootPath, '.gitignore'), DEFAULT_GITIGNORE, 'utf8');

  if (options.initialiseGit) {
    await execFileAsync('git', ['init'], { cwd: rootPath });
  }

  return {
    localPath: rootPath,
    projectConfig: metadata,
  };
}
