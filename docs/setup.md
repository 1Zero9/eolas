# Local setup

## Requirements

- Node.js 20 or later
- npm
- PostgreSQL database reachable through `DATABASE_URL`
- Git
- macOS for the local worker and Eolas Desktop
- Optional: a Gemini API key for brainstorming and build briefs

## Web application

```bash
npm install
cp .env.example .env.local
```

Set these values in `.env.local`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `AUTH_PASSWORD` | Yes | Strong single-user login password |
| `AUTH_SESSION_SECRET` | Yes | Independent random secret for signed browser sessions |
| `EOLAS_WORKER_SECRET` | Yes for worker | Shared secret used by the local worker |
| `EOLAS_DESKTOP_SECRET` | Yes for Desktop | Shared secret used by Eolas Desktop inbox polling |
| `GEMINI_API_KEY` | Optional | Enables AI brainstorm/build-brief requests |
| `GEMINI_MODEL` | Optional | Gemini model; defaults in code if unset |

Generate secrets with, for example:

```bash
openssl rand -base64 48
```

Apply migrations and start the web app:

```bash
npm run db:migrate
npm run dev
```

Open `http://localhost:3000` and sign in.

## Local worker

The worker creates projects under one safe parent directory. Set:

```bash
EOLAS_CLOUD_URL="http://localhost:3000"
EOLAS_WORKER_NAME="eolas-worker-local"
EOLAS_PROJECT_ROOT="/absolute/path/to/Projects"
EOLAS_WORKER_SECRET="same value as the web app"
```

Then run:

```bash
npm run worker:start
```

Keep this process running while using local build stages.

## Eolas Desktop menu-bar app

For development:

```bash
npm run desktop:start
```

For an installable app:

```bash
cd desktop
npm install
npm run dist
```

The app reads configuration from `~/Library/Application Support/Eolas/.env` when packaged. Create that file with owner-only permissions:

```bash
mkdir -p "$HOME/Library/Application Support/Eolas"
cp desktop/.env "$HOME/Library/Application Support/Eolas/.env"
chmod 600 "$HOME/Library/Application Support/Eolas/.env"
```

The file needs `EOLAS_CLOUD_URL` and `EOLAS_DESKTOP_SECRET`; add the worker secret and project root only to enable scanning. Enable **Launch at Login** from the tray menu after the app is open.

## Verify the installation

```bash
npm test
npx tsc --noEmit
npm run build
```

The Desktop inbox can be checked without printing the secret:

```bash
set -a; . desktop/.env; set +a
curl --silent --output /dev/null --write-out '%{http_code}\n' \
  -H "x-desktop-secret: $EOLAS_DESKTOP_SECRET" \
  "$EOLAS_CLOUD_URL/api/desktop/inbox"
```

It should return `200`.
