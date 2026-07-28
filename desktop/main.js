const path = require('path');
const { execFile } = require('child_process');
const { app, Tray, Menu, Notification, shell, nativeImage } = require('electron');
const { loadConfig } = require('./lib/config');
const { loadState, saveState } = require('./lib/state');

const config = loadConfig();
const statePath = path.join(app.getPath('userData'), 'state.json');
const scanScriptPath = path.join(__dirname, '..', 'scripts', 'scan-accelerators.js');

let tray = null;
let unseenIdeas = [];
let lastError = null;
let pollTimer = null;
let scanning = false;

function relativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function snippet(idea) {
  const title = idea.title && idea.title.trim() ? idea.title.trim() : idea.rawCapture.trim();
  return title.length > 60 ? `${title.slice(0, 57)}...` : title;
}

function ideaUrl(idea) {
  return `${config.cloudUrl}/ideas/${idea.id}`;
}

function updateTray() {
  if (!tray) return;

  tray.setTitle(unseenIdeas.length > 0 ? ` ${unseenIdeas.length}` : '');

  const tooltipLines = [];
  if (lastError) {
    tooltipLines.push(`Eolas — offline (${lastError})`);
  } else {
    tooltipLines.push(unseenIdeas.length > 0 ? `Eolas — ${unseenIdeas.length} new idea(s)` : 'Eolas — up to date');
  }
  tray.setToolTip(tooltipLines.join('\n'));

  const ideaMenuItems = unseenIdeas.slice(0, 10).map((idea) => ({
    label: `${snippet(idea)}  ·  ${relativeTime(idea.createdAt)}`,
    click: () => shell.openExternal(ideaUrl(idea)),
  }));

  const menu = Menu.buildFromTemplate([
    {
      label: lastError ? `Offline — ${lastError}` : `${unseenIdeas.length} new idea(s) captured`,
      enabled: false,
    },
    { type: 'separator' },
    ...(ideaMenuItems.length > 0 ? ideaMenuItems : [{ label: 'No new captures', enabled: false }]),
    { type: 'separator' },
    {
      label: 'Mark all as seen',
      enabled: unseenIdeas.length > 0,
      click: () => {
        unseenIdeas = [];
        updateTray();
      },
    },
    {
      label: 'Open Eolas',
      click: () => shell.openExternal(config.cloudUrl),
    },
    { type: 'separator' },
    {
      label: 'Check now',
      click: () => void poll(),
    },
    {
      label: scanning ? 'Scanning projects…' : 'Scan Projects for Accelerators',
      enabled: !scanning,
      click: () => void runScan(),
    },
    { type: 'separator' },
    { label: 'Quit Eolas Desktop', role: 'quit' },
  ]);

  tray.setContextMenu(menu);
}

async function poll() {
  if (!config.desktopSecret) {
    lastError = 'EOLAS_DESKTOP_SECRET not set';
    updateTray();
    return;
  }

  try {
    const response = await fetch(`${config.cloudUrl}/api/desktop/inbox`, {
      headers: { 'x-desktop-secret': config.desktopSecret },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const ideas = Array.isArray(payload.ideas) ? payload.ideas : [];

    const state = loadState(statePath);
    const knownIds = new Set(state.knownIds);
    const freshIdeas = ideas.filter((idea) => !knownIds.has(idea.id));

    lastError = null;

    if (freshIdeas.length > 0) {
      unseenIdeas = [...freshIdeas, ...unseenIdeas];

      if (freshIdeas.length === 1) {
        new Notification({
          title: 'New idea captured',
          body: snippet(freshIdeas[0]),
        }).show();
      } else {
        new Notification({
          title: 'New ideas captured',
          body: `${freshIdeas.length} new ideas landed in your Eolas inbox.`,
        }).show();
      }

      saveState(statePath, { knownIds: [...state.knownIds, ...freshIdeas.map((idea) => idea.id)] });
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'Unknown error';
  }

  updateTray();
}

function runScan() {
  if (scanning) return;

  if (!config.workerSecret) {
    new Notification({
      title: 'Cannot scan projects',
      body: 'Set EOLAS_WORKER_SECRET in desktop/.env to enable project scanning.',
    }).show();
    return;
  }

  scanning = true;
  updateTray();

  const env = {
    ...process.env,
    EOLAS_CLOUD_URL: config.cloudUrl,
    EOLAS_WORKER_SECRET: config.workerSecret,
  };

  if (config.projectRoot) {
    env.EOLAS_PROJECT_ROOT = config.projectRoot;
  }

  execFile('node', [scanScriptPath], { env }, (error, stdout, stderr) => {
    scanning = false;
    updateTray();

    if (error) {
      new Notification({
        title: 'Project scan failed',
        body: (stderr || error.message).slice(0, 200),
      }).show();
      return;
    }

    const lastLine = stdout.trim().split('\n').filter(Boolean).pop() || 'Scan complete.';
    new Notification({
      title: 'Project scan complete',
      body: lastLine,
    }).show();
  });
}

function startPolling() {
  void poll();
  pollTimer = setInterval(() => void poll(), config.pollIntervalMs);
}

app.on('ready', () => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  const iconPath = path.join(__dirname, 'assets', 'iconTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip('Eolas — checking...');

  updateTray();
  startPolling();
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.on('before-quit', () => {
  if (pollTimer) clearInterval(pollTimer);
});
