# Security and trust model

## Secrets

- Never commit `.env.local`, `desktop/.env`, or `~/Library/Application Support/Eolas/.env`.
- Use different, long random values for `AUTH_PASSWORD`, `AUTH_SESSION_SECRET`, `EOLAS_WORKER_SECRET`, and `EOLAS_DESKTOP_SECRET`.
- Rotate any secret that was ever committed or shared unexpectedly. Earlier project notes record an historic public-secret exposure; treat the old values as compromised.
- The Desktop app configuration file should be mode `600`.

## Browser authentication

The web app uses a single-user password plus an HTTP-only, signed seven-day cookie. A cookie value alone cannot authenticate a user. `AUTH_SESSION_SECRET` signs the session and must be independent of the password.

## Worker authentication and scope

The worker sends `EOLAS_WORKER_SECRET` to worker endpoints. It is intentionally a local single-owner model, not multi-tenant authentication. Protect the secret and use HTTPS whenever the cloud URL is not localhost.

The worker:

- writes only below `EOLAS_PROJECT_ROOT`;
- rejects path traversal and unrelated existing folders;
- verifies the local workspace's plan ID and hash before later stages;
- executes only known job types, not arbitrary shell commands.

## Approval boundaries

An approval covers one job, not a general permission. The following are separate actions:

1. create a workspace;
2. install dependencies;
3. run a build;
4. commit local changes;
5. push an existing GitHub remote.

Review the plan, job type, remote URL, and job history before approving.

## Local discovery privacy

The scanner reports matching file paths, sizes, and SHA-256 hashes. It does not upload code. Do not treat discovered candidates as approved accelerators; review them and create a versioned Git accelerator deliberately.

## GitHub backup

GitHub backup uses the Mac's existing SSH agent or credential manager. Eolas Cloud never receives a GitHub token or private key. Use an existing private repository and verify its remote URL before approving the job.

## Known limits

- There is no per-user account model or per-worker key rotation yet.
- There is no GitHub App integration for repository creation.
- Eolas does not provision services or deploy applications.
- Dependency installation uses `npm install --ignore-scripts`; review dependency changes before expanding that policy.
