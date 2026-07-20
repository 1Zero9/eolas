# Pickup Notes

## Current Status

- Travel-ready idea capture is implemented.
- Mobile capture route exists at `/mobile`.
- Ideas inbox and individual idea timelines are working.
- PWA install prompt and offline service worker support are in place.
- Recent UI improvements were committed and pushed.

## What is Done

- Added quick action buttons on the home page.
- Updated the ideas list to render as a timeline-style inbox.
- Created idea note and mobile capture support.
- Verified with a successful `npm run build`.

## What to Pick Up Next

1. Wire worker APIs and job execution fully.
2. Implement secure local workspace creation for approved promotions.
3. Validate the entire app with TypeScript and production build.
4. Harden routes, auth, and worker security.
5. Use this note in ChatGPT to discuss the next implementation steps and roadmap.

## ⚠️ Security follow-up (raised ~19 Jul, do not forget)

- Real secrets (`AUTH_PASSWORD`, `EOLAS_WORKER_SECRET`) were accidentally committed to `.env.example` and pushed to the **public** GitHub repo (commit `b129e79`).
- TODO: rotate both values in Vercel + local `.env`/worker config, and revert `.env.example` to placeholders.
- Old values are permanently exposed in git history on a public repo regardless of rotation — consider whether that matters for your use case.

## Notes

- Keep `.env.local` out of source control.
- Focus on a safe approval flow before local file system or Git operations.
- Continue the current loop: idea capture → inbox → promote → local job.
- Documentation now lives under `docs/`, with `docs/build-plan.md` and `docs/pickup.md`.
