const fs = require('fs');

const MAX_KNOWN_IDS = 500;

function loadState(statePath) {
  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);

    const knownIdeaIds = Array.isArray(parsed.knownIdeaIds)
      ? parsed.knownIdeaIds
      : Array.isArray(parsed.knownIds)
        ? parsed.knownIds
        : [];

    return {
      knownIdeaIds,
      knownAcceleratorIds: Array.isArray(parsed.knownAcceleratorIds) ? parsed.knownAcceleratorIds : [],
    };
  } catch {
    return { knownIdeaIds: [], knownAcceleratorIds: [] };
  }
}

function saveState(statePath, state) {
  const trimmed = {
    knownIdeaIds: state.knownIdeaIds.slice(-MAX_KNOWN_IDS),
    knownAcceleratorIds: state.knownAcceleratorIds.slice(-MAX_KNOWN_IDS),
  };
  fs.writeFileSync(statePath, JSON.stringify(trimmed, null, 2));
}

module.exports = { loadState, saveState };
