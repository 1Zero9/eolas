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

  return response.json();
}

async function heartbeat() {
  await globalThis.fetch(`${BASE_URL}/api/workers/heartbeat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name: WORKER_NAME }),
  });
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

  return response.json();
}

async function reportJobResult(jobId, success, payload) {
  await globalThis.fetch(`${BASE_URL}/api/workers/complete-job`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      jobId,
      success,
      result: success ? payload : null,
      errorMessage: success ? undefined : payload,
    }),
  });
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
    const normalizedFilePath = path.normalize(file.path);
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
  const projectSlug = sanitizeSlug(payload.slug || payload.projectName || `project-${job.id}`);
  const projectRoot = ensureSafePath(ALLOWED_ROOT, path.resolve(ALLOWED_ROOT, projectSlug));

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

  return { localPath: projectRoot };
}

async function handleJob(job) {
  switch (job.type) {
    case 'create_local_workspace':
      return handleCreateLocalWorkspace(job);
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
      const result = await handleJob(job);
      console.log('Completed job', job.id, result);
      await reportJobResult(job.id, true, result);
    } catch (error) {
      console.error('Worker error:', error.message || error);
      await reportJobResult(error?.jobId ?? null, false, error.message ?? String(error));
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
