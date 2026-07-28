const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const contents = fs.readFileSync(filePath, 'utf8');
  const result = {};

  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function loadConfig() {
  const fileValues = parseEnvFile(path.join(__dirname, '..', '.env'));

  const cloudUrl = process.env.EOLAS_CLOUD_URL || fileValues.EOLAS_CLOUD_URL || 'http://localhost:3000';
  const desktopSecret = process.env.EOLAS_DESKTOP_SECRET || fileValues.EOLAS_DESKTOP_SECRET;
  const pollIntervalMs = Number(process.env.EOLAS_DESKTOP_POLL_MS || fileValues.EOLAS_DESKTOP_POLL_MS || 60000);

  return { cloudUrl: cloudUrl.replace(/\/$/, ''), desktopSecret, pollIntervalMs };
}

module.exports = { loadConfig };
