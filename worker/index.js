const fs = require('node:fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');

const execFileAsync = util.promisify(execFile);
const BASE_URL = process.env.EOLAS_CLOUD_URL || 'http://localhost:3000';
const WORKER_NAME = process.env.EOLAS_WORKER_NAME || `eolas-worker-${os.hostname()}`;
const ALLOWED_ROOT = path.resolve(process.env.EOLAS_PROJECT_ROOT || path.join(os.homedir(), 'Projects'));
const WORKER_SECRET = process.env.EOLAS_WORKER_SECRET;

if (typeof globalThis.fetch !== 'function') {
  throw new Error('Worker requires Node 20+ with built-in fetch support.');
}

if (!WORKER_SECRET) {
  throw new Error(
    'EOLAS_WORKER_SECRET is not set. Set it to the same value as the cloud app\'s EOLAS_WORKER_SECRET env var.',
  );
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-worker-secret': WORKER_SECRET,
  };
}

async function registerWorker() {
  const response = await globalThis.fetch(`${BASE_URL}/api/workers/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name: WORKER_NAME,
      hostname: os.hostname(),
      platform: os.platform(),
      allowedProjectRoot: ALLOWED_ROOT,
      capabilities: ['file_generation', 'git_init'],
    }),
  });

  if (!response.ok) throw new Error(`Worker registration failed: HTTP ${response.status}`);
  return response.json();
}

async function heartbeat() {
  const response = await globalThis.fetch(`${BASE_URL}/api/workers/heartbeat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name: WORKER_NAME }),
  });
  if (!response.ok) throw new Error(`Worker heartbeat failed: HTTP ${response.status}`);
}

async function claimJob() {
  const response = await globalThis.fetch(`${BASE_URL}/api/workers/claim-job`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ workerId: WORKER_NAME }),
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) throw new Error(`Worker claim failed: HTTP ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function reportJobResult(jobId, success, payload) {
  const response = await globalThis.fetch(`${BASE_URL}/api/workers/complete-job`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      jobId,
      success,
      result: success ? payload : null,
      errorMessage: success ? undefined : payload,
    }),
  });
  if (!response.ok) throw new Error(`Worker completion report failed: HTTP ${response.status}`);
}

function sanitizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function ensureSafePath(root, target) {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(target);
  const relative = path.relative(normalizedRoot, normalizedTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path is outside the allowed project root');
  }

  return normalizedTarget;
}

async function writeWorkspaceFiles(rootPath, files) {
  for (const file of files) {
    if (!file || typeof file.path !== 'string' || typeof file.content !== 'string') {
      throw new Error('Assembly plan contains an invalid file entry');
    }
    const normalizedFilePath = path.normalize(file.path);
    if (path.isAbsolute(normalizedFilePath) || normalizedFilePath === '..' || normalizedFilePath.startsWith(`..${path.sep}`)) {
      throw new Error(`Unsafe assembly-plan path: ${file.path}`);
    }
    const targetPath = ensureSafePath(rootPath, path.resolve(rootPath, normalizedFilePath));
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, file.content ?? '', 'utf8');
  }
}

async function initializeGitRepository(rootPath) {
  await execFileAsync('git', ['init'], { cwd: rootPath });
}

async function handleCreateLocalWorkspace(job) {
  const payload = job.payload || {};
  if (!payload.assemblyPlanId || !payload.planHash) {
    throw new Error('Workspace jobs must reference an approved immutable assembly plan');
  }
  const projectSlug = sanitizeSlug(payload.slug || payload.projectName || `project-${job.id}`);
  if (!projectSlug) throw new Error('Workspace job has no usable project slug');
  const projectRoot = ensureSafePath(ALLOWED_ROOT, path.resolve(ALLOWED_ROOT, projectSlug));

  let existingEntries = [];
  try {
    existingEntries = await fs.readdir(projectRoot);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  // A repeat of the same approved plan is safe. Any other existing directory is
  // deliberately refused: approval is for this exact plan, never for overwriting work.
  if (existingEntries.length > 0) {
    try {
      const existing = JSON.parse(await fs.readFile(path.join(projectRoot, '.eolas', 'project.json'), 'utf8'));
      if (existing.assemblyPlanId === payload.assemblyPlanId && existing.planHash === payload.planHash) {
        return { localPath: projectRoot, idempotent: true };
      }
    } catch {
      // fall through to the explicit refusal below
    }
    throw new Error(`Refusing to write into existing workspace: ${projectRoot}`);
  }

  await fs.mkdir(projectRoot, { recursive: true });
  await writeWorkspaceFiles(projectRoot, payload.files || []);

  const configPath = path.join(projectRoot, '.eolas');
  await fs.mkdir(configPath, { recursive: true });
  await fs.writeFile(
    path.join(configPath, 'project.json'),
    JSON.stringify(
      {
        projectId: payload.projectId,
        projectName: payload.projectName,
        projectSlug,
        assemblyPlanId: payload.assemblyPlanId,
        planHash: payload.planHash,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );

  await fs.writeFile(path.join(projectRoot, '.gitignore'), 'node_modules\n.DS_Store\n.next\n', 'utf8');

  if (payload.initialiseGit) {
    await initializeGitRepository(projectRoot);
  }

  return { localPath: projectRoot, idempotent: false };
}

async function getApprovedProjectRoot(job) {
  const payload = job.payload || {};
  if (!payload.assemblyPlanId || !payload.planHash || typeof payload.slug !== 'string') throw new Error('Project stage must reference an approved assembly plan');
  const projectRoot = ensureSafePath(ALLOWED_ROOT, path.resolve(ALLOWED_ROOT, sanitizeSlug(payload.slug)));
  const config = JSON.parse(await fs.readFile(path.join(projectRoot, '.eolas', 'project.json'), 'utf8'));
  if (config.assemblyPlanId !== payload.assemblyPlanId || config.planHash !== payload.planHash) throw new Error('Workspace does not match the approved assembly plan');
  return projectRoot;
}

async function handleInstallDependencies(job) {
  const projectRoot = await getApprovedProjectRoot(job);
  await execFileAsync('npm', ['install', '--ignore-scripts'], { cwd: projectRoot, maxBuffer: 1024 * 1024 * 10 });
  return { localPath: projectRoot, command: 'npm install --ignore-scripts' };
}

async function handleRunBuild(job) {
  const projectRoot = await getApprovedProjectRoot(job);
  await execFileAsync('npm', ['run', 'build'], { cwd: projectRoot, maxBuffer: 1024 * 1024 * 10 });
  return { localPath: projectRoot, command: 'npm run build' };
}

async function handleGitCommit(job) {
  const projectRoot = await getApprovedProjectRoot(job);
  await execFileAsync('git', ['add', '--all'], { cwd: projectRoot });
  const { stdout } = await execFileAsync('git', ['status', '--porcelain'], { cwd: projectRoot });
  if (!stdout.trim()) return { localPath: projectRoot, committed: false, message: 'No changes to commit' };
  await execFileAsync('git', ['commit', '-m', 'Eolas: approved local build'], { cwd: projectRoot });
  const { stdout: sha } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
  return { localPath: projectRoot, committed: true, commitSha: sha.trim() };
}

function isGitHubRemote(value) {
  return typeof value === 'string' && (
    /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(value) ||
    /^git@github\.com:[\w.-]+\/[\w.-]+(?:\.git)?$/.test(value)
  );
}

async function handleGitHubBackup(job) {
  const projectRoot = await getApprovedProjectRoot(job);
  const remote = job.payload?.githubUrl;
  if (!isGitHubRemote(remote)) throw new Error('Backup job has an invalid GitHub remote');
  let existingRemote = '';
  try { ({ stdout: existingRemote } = await execFileAsync('git', ['remote', 'get-url', 'origin'], { cwd: projectRoot })); } catch { /* origin is not configured yet */ }
  if (existingRemote.trim() && existingRemote.trim() !== remote) throw new Error(`Refusing to replace existing origin: ${existingRemote.trim()}`);
  if (!existingRemote.trim()) await execFileAsync('git', ['remote', 'add', 'origin', remote], { cwd: projectRoot });
  await execFileAsync('git', ['push', '-u', 'origin', 'HEAD'], { cwd: projectRoot, maxBuffer: 1024 * 1024 * 10 });
  const { stdout: sha } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
  return { localPath: projectRoot, githubUrl: remote, commitSha: sha.trim() };
}

async function handleJob(job) {
  switch (job.type) {
    case 'create_local_workspace':
      return handleCreateLocalWorkspace(job);
    case 'install_dependencies':
      return handleInstallDependencies(job);
    case 'run_build':
      return handleRunBuild(job);
    case 'git_commit':
      return handleGitCommit(job);
    case 'github_backup':
      return handleGitHubBackup(job);
    default:
      throw new Error(`Unsupported job type: ${job.type}`);
  }
}

async function main() {
  console.log('Registering worker:', WORKER_NAME);
  await registerWorker();

  while (true) {
    try {
      await heartbeat();
      const job = await claimJob();

      if (!job) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      console.log('Claimed job', job.id, job.type);
      try {
        const result = await handleJob(job);
        console.log('Completed job', job.id, result);
        await reportJobResult(job.id, true, result);
      } catch (error) {
        console.error('Job failed', job.id, error.message || error);
        await reportJobResult(job.id, false, error.message || String(error));
      }
    } catch (error) {
      console.error('Worker error:', error.message || error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
