# Eolas

Eolas is a local-first idea-to-project system. It captures ideas, records validation decisions, assembles approved reusable code accelerators, and carries an explicitly approved project through local build stages and optional GitHub backup.

The central promise is simple: preserve the original idea, make the decision to build deliberate, and reuse reliable implementation rather than paying to regenerate the same foundations repeatedly.

## Start here

- [Plain-English guide](docs/overview.md) — what Eolas is and how it works.
- [User guide](docs/user-guide.md) — use the idea, project, jobs, and accelerator screens.
- [Setup guide](docs/setup.md) — run the web app, worker, and menu-bar app locally.
- [Architecture](docs/architecture.md) — components, data flow, and approval boundaries.
- [Operations runbook](docs/operations.md) — migrations, worker behaviour, recovery, and GitHub backup.
- [Accelerator guide](docs/accelerator-contract.md) — author and maintain reusable implementation units.
- [Security](docs/security.md) — credentials, trust boundaries, and operational rules.
- [Development guide](docs/development.md) — repository layout, commands, and tests.

## Quick local start

```bash
npm install
cp .env.example .env.local
# fill in DATABASE_URL, AUTH_PASSWORD, AUTH_SESSION_SECRET and worker secrets
npm run db:migrate
npm run dev
```

In a second terminal, start the local worker:

```bash
npm run worker:start
```

See the [full setup guide](docs/setup.md) before using a real database or GitHub remote.

## Current implementation

The implemented path is:

```text
Capture → incubate → validate → create assembly plan → approve workspace
→ approve dependency install → approve build → approve local commit → approve GitHub backup
```

Each stage is visible in Eolas and requires a separate approval before the local worker acts.
