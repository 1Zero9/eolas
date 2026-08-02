# Operating Eolas locally

## First deployment of assembly plans

1. Set strong `AUTH_PASSWORD` and a separate random `AUTH_SESSION_SECRET` in the web application's environment. Existing browser sessions will be invalidated.
2. Apply the additive database migration with `npm run db:migrate` in the environment that has `DATABASE_URL` configured.
3. Restart the web application and local worker.
4. Create an assembly plan from an idea, inspect its selected versions, file snapshot, reuse metric, and conflicts, then approve it from the project page.

Legacy `create_local_workspace` jobs cannot be approved because they lack an immutable plan hash. Re-promote the original idea to create a safe replacement plan.

## Worker guarantees

The worker accepts only workspace jobs containing an assembly plan ID and plan hash. It writes only inside `EOLAS_PROJECT_ROOT`; it rejects unsafe file paths and existing project directories. A repeated execution of the exact same plan is idempotent and returns the existing workspace without changing it.

The worker creates the local workspace and Git repository, then performs only separately approved build stages. Generated-code application, external-service creation, and deployment remain deliberately separate future job types.

## Approved local build stages

After the workspace plan has completed, a project can schedule one stage at a time. Each stage is created as `PENDING` and must be approved in Jobs before a worker claims it:

1. `install_dependencies` runs `npm install --ignore-scripts` in the verified plan workspace.
2. `run_build` runs `npm run build` only after dependency installation completed.
3. `git_commit` stages all changes and creates one local commit only after a successful build.

Each stage rechecks `.eolas/project.json` against the approved plan ID and hash before executing.

`github_backup` is an explicit final stage for an already-created private GitHub repository. Supply its HTTPS or SSH GitHub remote in the project screen, schedule the job, then approve it in Jobs. The worker refuses non-GitHub remotes and refuses to replace an existing `origin` with a different URL. It uses the Mac's existing Git credential manager or SSH agent; Eolas Cloud never receives your GitHub token or private key.

External-service creation and deployment are intentionally not implemented yet; they need their own provider credentials and approval contracts.
