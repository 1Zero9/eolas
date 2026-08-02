# Architecture

## Components

| Component | Responsibility | Trust level |
| --- | --- | --- |
| Next.js web app | Ideas, validation, plans, projects, jobs, approvals | Cloud-coordinated control plane |
| PostgreSQL / Prisma | Persistent ideas, plans, jobs, audit events, worker metadata | Source of operational record |
| Local worker | Creates and operates only approved local workspaces | Trusted Mac execution agent |
| Eolas Desktop | Menu-bar notifications and local accelerator discovery | Optional Mac companion |
| GitHub | Optional private source backup | External backup target |

## Organisation boundary

`Organization` is the top-level ownership record. Ideas, projects, and jobs carry a required organisation ID; notes, validation records, plans, and events inherit ownership through their parent record. Admin queries use the active workspace cookie and public capture requests resolve one organisation by its URL slug.

Existing data is migrated to a capture-disabled **Legacy workspace**. This preserves history without accidentally exposing historical ideas through a new public capture URL.

## Data and execution flow

```text
Browser or PWA
  → Idea + workspace + validation decision
  → Project + immutable assembly plan
  → approval
  → Job queue
  → authenticated local worker
  → verified local workspace
  → approved build stages
  → optional GitHub push
```

### Immutable assembly plans

An assembly plan records selected accelerator versions, each file's content hash, conflict list, and code-reuse metric. A worker job receives that frozen snapshot. It never re-reads an accelerator folder while executing a previously approved plan.

### Worker verification

The worker is limited to `EOLAS_PROJECT_ROOT`. Before writing or running a project stage, it verifies `.eolas/project.json` matches the assembly plan ID and hash. It rejects traversal paths, unrelated existing folders, and plans that do not match the local workspace.

### Job lifecycle

Jobs move through `PENDING` → `QUEUED` → `RUNNING` → `COMPLETED` or `FAILED`. Failed jobs retry up to their configured limit. The system records creation, approval, claim, retry/failure, and completion events in `JobEvent`.

## Important boundaries

- Cloud may store plans and coordinate work; it does not run filesystem or Git commands on the Mac.
- The worker has a shared worker secret and only claims approved local jobs.
- Each sensitive action is its own job and approval: workspace creation, dependency installation, build, commit, and backup.
- The discovery scanner sends file metadata and hashes only; it does not upload repository source code.
