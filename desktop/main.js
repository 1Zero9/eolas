const path = require('path');
const { execFile } = require('child_process');
const { app, Tray, Menu, Notification, shell, nativeImage } = require('electron');
const { loadConfig } = require('./lib/config');
const { loadState, saveState } = require('./lib/state');

// Electron's app paths are available only after the runtime has initialized.
// Keeping this setup in `ready` avoids a launch-time failure before the tray
// icon is created.
let config;
let statePath;
let scanScriptPath;

let tray = null;
let unseenItems = [];
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

function ideaSnippet(idea) {
  const title = idea.title && idea.title.trim() ? idea.title.trim() : idea.rawCapture.trim();
  return title.length > 60 ? `${title.slice(0, 57)}...` : title;
}

function itemUrl(item) {
  return item.kind === 'accelerator' ? `${config.cloudUrl}/accelerators` : `${config.cloudUrl}/ideas/${item.id}`;
}

function itemLabel(item) {
  if (item.kind === 'accelerator') {
    const state = item.status === 'DISCOVERED' ? 'Discovered' : 'Accelerator';
    return `${state}: ${item.name}`;
  }
  return `Idea: ${ideaSnippet(item)}`;
}

function updateTray() {
  if (!tray) return;

  tray.setTitle(unseenItems.length > 0 ? ` ${unseenItems.length}` : '');

  const tooltipLines = [];
  if (lastError) {
    tooltipLines.push(`Eolas — offline (${lastError})`);
  } else {
    tooltipLines.push(unseenItems.length > 0 ? `Eolas — ${unseenItems.length} new item(s)` : 'Eolas — up to date');
  }
  tray.setToolTip(tooltipLines.join('\n'));

  const itemMenuItems = unseenItems.slice(0, 12).map((item) => ({
    label: `${itemLabel(item)}  ·  ${relativeTime(item.createdAt)}`,
    click: () => shell.openExternal(itemUrl(item)),
  }));

  const loginItemSettings = app.getLoginItemSettings();

  const menu = Menu.buildFromTemplate([
    {
      label: lastError ? `Offline — ${lastError}` : `${unseenItems.length} new item(s)`,
      enabled: false,
    },
    { type: 'separator' },
    ...(itemMenuItems.length > 0 ? itemMenuItems : [{ label: 'No new activity', enabled: false }]),
    { type: 'separator' },
    {
      label: 'Mark all as seen',
      enabled: unseenItems.length > 0,
      click: () => {
        unseenItems = [];
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
    {
      label: 'Launch at Login',
      type: 'checkbox',
      checked: loginItemSettings.openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({ openAtLogin: menuItem.checked });
      },
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
    const accelerators = Array.isArray(payload.accelerators) ? payload.accelerators : [];

    const state = loadState(statePath);
    const knownIdeaIds = new Set(state.knownIdeaIds);
    const knownAcceleratorIds = new Set(state.knownAcceleratorIds);

    const freshIdeas = ideas.filter((idea) => !knownIdeaIds.has(idea.id));
    const freshAccelerators = accelerators.filter((accelerator) => !knownAcceleratorIds.has(accelerator.id));

    lastError = null;

    const freshItems = [
      ...freshIdeas.map((idea) => ({ kind: 'idea', ...idea })),
      ...freshAccelerators.map((accelerator) => ({ kind: 'accelerator', ...accelerator })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (freshItems.length > 0) {
      unseenItems = [...freshItems, ...unseenItems];

      if (freshItems.length === 1) {
        const item = freshItems[0];
        new Notification({
          title: item.kind === 'accelerator' ? 'New accelerator' : 'New idea captured',
          body: itemLabel(item),
        }).show();
      } else {
        const parts = [];
        if (freshIdeas.length > 0) parts.push(`${freshIdeas.length} idea(s)`);
        if (freshAccelerators.length > 0) parts.push(`${freshAccelerators.length} accelerator(s)`);
        new Notification({
          title: 'New activity in Eolas',
          body: parts.join(' and '),
        }).show();
      }

      saveState(statePath, {
        knownIdeaIds: [...state.knownIdeaIds, ...freshIdeas.map((idea) => idea.id)],
        knownAcceleratorIds: [...state.knownAcceleratorIds, ...freshAccelerators.map((accelerator) => accelerator.id)],
      });
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

    void poll();
  });
}

function startPolling() {
  void poll();
  pollTimer = setInterval(() => void poll(), config.pollIntervalMs);
}

app.on('ready', () => {
  config = loadConfig();
  statePath = path.join(app.getPath('userData'), 'state.json');
  scanScriptPath = app.isPackaged
    ? path.join(process.resourcesPath, 'scripts', 'scan-accelerators.js')
    : path.join(__dirname, '..', 'scripts', 'scan-accelerators.js');

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
