const fs = require('fs');

const MAX_KNOWN_IDS = 500;

function loadState(statePath) {
  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return { knownIds: Array.isArray(parsed.knownIds) ? parsed.knownIds : [] };
  } catch {
    return { knownIds: [] };
  }
}

function saveState(statePath, state) {
  const trimmed = {
    knownIds: state.knownIds.slice(-MAX_KNOWN_IDS),
  };
  fs.writeFileSync(statePath, JSON.stringify(trimmed, null, 2));
}

module.exports = { loadState, saveState };
