# Development guide

## Repository layout

```text
accelerators/        Versioned reusable implementation units
desktop/             Electron menu-bar app
docs/                Product, setup, operations, and technical docs
prisma/              Schema and additive migrations
scripts/             Local discovery tooling
src/app/             Next.js pages and route handlers
src/lib/             Domain services: ideas, plans, jobs, auth, accelerators
worker/              Local worker process
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js development server |
| `npm run build` | Generate Prisma client and produce production build |
| `npm run db:migrate` | Apply checked-in Prisma migrations |
| `npm run env:doctor` | Validate required local environment configuration without printing secrets |
| `npm test` | Run Vitest tests |
| `npm run verify:accelerators` | Build real temporary projects from approved accelerator combinations |
| `npm run lint` | Run Next.js ESLint |
| `npm run worker:start` | Start the local worker |
| `npm run scan:accelerators` | Scan local Git repositories for metadata-only candidates |
| `npm run desktop:start` | Install/run the Electron app in development |

## Database changes

1. Update `prisma/schema.prisma`.
2. Create an additive migration in `prisma/migrations/`.
3. Regenerate the client with `npx prisma generate`.
4. Test against a non-production database before `npm run db:migrate` in production.

Do not put migration deployment inside `npm run build`; build should remain safe for CI and local validation.

## Quality bar

Before a commit:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run verify:accelerators
npm run build
git diff --check
```

Current tests cover signed sessions, accelerator manifest loading, validation schema constraints, and deterministic assembly/collision behaviour. Add tests when changing approval, filesystem, or accelerator composition rules.

## Adding a feature

Keep the approval boundary explicit. A new action that affects the filesystem, packages, Git, a cloud service, or deployment should be a named job type with:

- validated payload;
- clear prerequisites;
- user approval;
- worker-side allowlist and verification;
- audit events;
- tests and operations documentation.
