const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(process.cwd(), '.env.local');
const required = [
  ['DATABASE_URL', 1],
  ['AUTH_PASSWORD', 12],
  ['AUTH_SESSION_SECRET', 32],
  ['EOLAS_WORKER_SECRET', 32],
  ['EOLAS_DESKTOP_SECRET', 32],
];

if (!fs.existsSync(filePath)) {
  console.error('Missing .env.local. Copy .env.example and add local values.');
  process.exit(1);
}

const values = new Map();
const errors = [];
for (const [index, rawLine] of fs.readFileSync(filePath, 'utf8').split(/\r?\n/).entries()) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const match = rawLine.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  if (!match) {
    if (/^[A-Z][A-Z0-9_]*\s*=/.test(rawLine) || /^[A-Z][A-Z0-9_]*=\s+/.test(rawLine)) {
      errors.push(`Line ${index + 1}: environment assignments must not contain whitespace around =.`);
    }
    continue;
  }
  let value = match[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  values.set(match[1], value);
}

for (const [name, minimumLength] of required) {
  const value = values.get(name);
  if (!value) errors.push(`${name} is missing.`);
  else if (value.length < minimumLength) errors.push(`${name} must be at least ${minimumLength} characters.`);
  else if (['change-me', 'eolas', 'xxxxxxx'].includes(value)) errors.push(`${name} uses a placeholder or default value.`);
}

if (errors.length) {
  console.error('Eolas environment check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Eolas environment check passed.');
