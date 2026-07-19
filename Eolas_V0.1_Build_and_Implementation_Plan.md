# Eolas — V0.1 Build and Implementation Plan

> **Purpose:** Build the first working Eolas loop: capture an idea from mobile, store it safely in the cloud, enrich it, queue work, hand approved work to a local Mac worker, create a local project workspace, and back it up to GitHub.

---

## 1. Current Starting Point

The following is already in place:

- Local Eolas repository created
- GitHub repository created
- Vercel project connected
- `README.md` present
- `.env.local` present
- Prisma configured
- Database connected but currently blank

This plan assumes the repository itself is otherwise empty.

---

## 2. V0.1 Success Definition

V0.1 is complete when this full workflow works reliably:

```text
Idea captured on mobile
        ↓
Stored securely in the cloud database
        ↓
Displayed in the Eolas dashboard
        ↓
Original wording preserved
        ↓
Idea enriched into a structured brief
        ↓
User approves promotion to project
        ↓
Local Mac worker receives a queued job
        ↓
Local project folder and documentation created
        ↓
Git repository initialised
        ↓
Private GitHub repository created and pushed
```

Do not start with full code generation, repository-wide semantic search, component similarity, CVE automation or production deployment.

First prove the capture-to-local-workspace loop.

---

# 3. Product Principles

## 3.1 Local-first, not local-only

Eolas should work across three locations:

### Eolas Cloud

Stores:

- Ideas
- Project metadata
- Analysis results
- Job queue
- Worker state
- Audit history
- Accelerator metadata
- Backup state

### Mac Worker

Performs:

- Local repository scanning
- File creation
- Accelerator assembly
- Git commands
- Testing
- Build commands
- Local documentation generation

### GitHub

Provides:

- Source control
- Off-device backup
- Version history
- Private repositories
- Recovery from local hardware failure

---

## 3.2 Preserve intent

Eolas must retain:

- The exact original idea
- Generated summaries
- User edits
- Analysis history
- Decisions
- Source code provenance
- Reused accelerator versions
- Generated-code records

Generated content must never replace the original capture.

---

## 3.3 Capability-led architecture

Do not hard-code the platform around individual vendors.

Use capabilities such as:

- Coding AI
- Authentication
- Relational database
- Transactional email
- Deployment
- Product analytics
- Error monitoring
- Vector search
- Payments
- File storage

Providers can be selected later and changed over time.

---

## 3.4 Human approval boundaries

Cloud jobs may analyse and recommend.

The local worker may only perform approved actions.

Initially require approval before:

- Installing packages
- Modifying existing code
- Copying code between repositories
- Committing changes
- Pushing to GitHub
- Creating external services
- Deploying
- Deleting or overwriting files

---

# 4. Recommended Repository Structure

Convert the repository into a lightweight monorepo.

```text
eolas/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── worker/
│       ├── src/
│       │   ├── handlers/
│       │   ├── services/
│       │   ├── security/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   ├── schemas/
│   ├── job-types/
│   ├── repository-scanner/
│   └── shared/
│
├── docs/
│   ├── architecture.md
│   ├── build-plan.md
│   ├── product-brief.md
│   ├── roadmap.md
│   ├── security.md
│   └── decisions/
│
├── accelerators/
│   ├── documentation-pack/
│   ├── github-baseline/
│   └── nextjs-baseline/
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   ├── pull_request_template.md
│   └── dependabot.yml
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── turbo.json
```

For the first implementation, it is acceptable to keep the web app at the repository root and add `worker/` later. Do not restructure solely for appearance. Restructure when the worker implementation begins.

---

# 5. Environment Variables

Create `.env.example` with names only.

```bash
# Database
DATABASE_URL=

# Application
NEXT_PUBLIC_APP_URL=
APP_ENV=

# Authentication
AUTH_SECRET=

# AI provider
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=

# Worker authentication
EOLAS_WORKER_SECRET=
EOLAS_WORKER_TOKEN_TTL_MINUTES=

# GitHub integration
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_INSTALLATION_ID=

# Optional observability
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

Rules:

- Never commit `.env.local`
- Never include real credentials in documentation
- Store local worker secrets in macOS Keychain
- Use separate development, preview and production credentials
- Prefer a GitHub App over a broad personal access token
- Use least-privilege permissions

---

# 6. Initial Prisma Data Model

Use this as the first schema. Adjust provider-specific fields only where required.

```prisma
enum IdeaStatus {
  INBOX
  ANALYSING
  ASSESSED
  READY
  QUEUED
  BUILDING
  POC
  MVP
  PARKED
  REJECTED
}

enum IdeaSource {
  WEB
  MOBILE
  VOICE
  IMPORT
  API
}

enum ProjectStatus {
  IDEA
  PLANNED
  ACTIVE
  POC
  MVP
  PRODUCTION_CANDIDATE
  LIVE
  MAINTAINED
  PARKED
  ARCHIVED
}

enum JobStatus {
  PENDING
  QUEUED
  RUNNING
  WAITING_FOR_APPROVAL
  COMPLETED
  FAILED
  CANCELLED
}

enum JobExecutionTarget {
  CLOUD
  LOCAL_WORKER
  EXTERNAL_SERVICE
}

enum WorkerStatus {
  ONLINE
  OFFLINE
  BUSY
  DISABLED
}

enum AnalysisStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  APPROVED
  REJECTED
}

model Idea {
  id              String         @id @default(cuid())
  title           String?
  rawCapture      String         @db.Text
  summary         String?        @db.Text
  status          IdeaStatus     @default(INBOX)
  source          IdeaSource     @default(WEB)
  promotedProject Project?
  analyses        IdeaAnalysis[]
  tags            IdeaTag[]
  jobs            Job[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([status])
  @@index([createdAt])
}

model IdeaTag {
  id        String   @id @default(cuid())
  ideaId    String
  tag       String
  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([ideaId, tag])
  @@index([tag])
}

model IdeaAnalysis {
  id                    String         @id @default(cuid())
  ideaId                String
  status                AnalysisStatus @default(PENDING)
  provider              String?
  model                  String?
  promptVersion         String?
  generatedTitle        String?
  generatedSummary      String?        @db.Text
  problemStatement      String?        @db.Text
  intendedUsers         Json?
  categories            Json?
  suggestedCapabilities Json?
  relatedProjects       Json?
  relatedAccelerators   Json?
  clarificationQuestions Json?
  recommendedNextAction String?        @db.Text
  confidence            Float?
  rawResponse           Json?
  errorMessage          String?        @db.Text
  idea                   Idea          @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  @@index([ideaId, createdAt])
}

model Project {
  id            String        @id @default(cuid())
  ideaId        String?       @unique
  name          String
  slug          String        @unique
  description   String?       @db.Text
  status        ProjectStatus @default(PLANNED)
  localPath     String?
  githubUrl     String?
  githubRepo    String?
  defaultBranch String?
  lastCommitSha String?
  backedUpAt    DateTime?
  idea          Idea?         @relation(fields: [ideaId], references: [id], onDelete: SetNull)
  jobs          Job[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([status])
}

model Job {
  id                  String             @id @default(cuid())
  ideaId              String?
  projectId           String?
  workerId            String?
  type                String
  status              JobStatus          @default(PENDING)
  executionTarget     JobExecutionTarget
  priority            Int                @default(100)
  payload             Json
  result              Json?
  requiresApproval    Boolean            @default(false)
  approvedAt          DateTime?
  approvedBy          String?
  attempts            Int                @default(0)
  maxAttempts         Int                @default(3)
  lockedAt            DateTime?
  lockedBy            String?
  startedAt           DateTime?
  completedAt         DateTime?
  errorMessage        String?            @db.Text
  idea                Idea?              @relation(fields: [ideaId], references: [id], onDelete: SetNull)
  project             Project?           @relation(fields: [projectId], references: [id], onDelete: SetNull)
  worker              Worker?            @relation(fields: [workerId], references: [id], onDelete: SetNull)
  events              JobEvent[]
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  @@index([status, executionTarget, priority])
  @@index([workerId, status])
}

model JobEvent {
  id        String   @id @default(cuid())
  jobId     String
  eventType String
  message   String   @db.Text
  metadata  Json?
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([jobId, createdAt])
}

model Worker {
  id                String       @id @default(cuid())
  name              String       @unique
  platform          String
  hostname          String?
  status            WorkerStatus @default(OFFLINE)
  allowedProjectRoot String
  capabilities      Json
  version           String?
  lastSeenAt        DateTime?
  currentJobId      String?
  jobs              Job[]
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@index([status, lastSeenAt])
}
```

Run:

```bash
npx prisma format
npx prisma migrate dev --name initial_eolas_schema
npx prisma generate
```

Add a Prisma client singleton suitable for development hot reload.

---

# 7. Implementation Sprints

## Sprint 1 — Mobile capture and idea inbox

### Goal

An idea entered on a phone appears in the Eolas dashboard and survives refresh, redeployment and local hardware failure.

### Build

#### 1. Create the idea service

Implement:

```text
createIdea()
getIdea()
listIdeas()
updateIdea()
changeIdeaStatus()
```

Keep database access behind a service or repository layer.

Suggested location:

```text
src/lib/ideas/idea-service.ts
```

#### 2. Create the mobile capture page

Route:

```text
/capture
```

Fields:

- Idea text — required
- Optional title
- Source automatically set to `MOBILE` when used from the mobile capture interface

Actions:

- Save Idea
- Save and Add Another

Requirements:

- Mobile-first
- Large touch targets
- No compulsory categorisation
- Clear success confirmation
- Preserve draft text if submission fails
- Under 30 seconds to capture an idea

#### 3. Create the idea inbox

Route:

```text
/ideas
```

Show:

- Title or truncated first line
- Status
- Capture source
- Created date
- Analysis state
- Next action

Filters:

- Inbox
- Analysing
- Assessed
- Ready
- Parked
- Rejected

#### 4. Create the idea detail page

Route:

```text
/ideas/[id]
```

Show:

- Original capture
- Generated analysis area
- Tags
- Timeline
- Related jobs
- Actions

Actions:

- Edit
- Analyse
- Park
- Reject
- Promote to Project

#### 5. Add basic authentication

Do not expose private ideas publicly.

For V0.1, a single-user authenticated application is sufficient.

### Sprint 1 acceptance tests

- An authenticated user can open `/capture` on mobile
- An idea can be saved with only raw text
- The raw idea is preserved exactly
- The idea appears in `/ideas`
- The idea can be opened and edited
- Unauthenticated access is blocked
- The data remains available after deployment
- Validation errors are clear
- Failed saves do not silently discard the draft

---

## Sprint 2 — Analysis jobs

### Goal

A raw idea becomes a structured, reviewable brief without replacing the original capture.

### Build

#### 1. Add job creation

When the user chooses **Analyse**, create:

```text
type: analyse_idea
executionTarget: CLOUD
status: QUEUED
```

#### 2. Implement a job runner

For V0.1, use a secure server-side endpoint or scheduled execution mechanism.

The runner should:

1. Claim one queued cloud job
2. Set it to `RUNNING`
3. Write a `JobEvent`
4. Execute the handler
5. Save the result
6. Mark it `COMPLETED` or `FAILED`
7. Record the full error safely

#### 3. Define structured AI output

Use schema validation.

Expected shape:

```typescript
type IdeaAnalysisOutput = {
  title: string;
  summary: string;
  problem: string;
  intendedUsers: string[];
  categories: string[];
  suggestedCapabilities: string[];
  relatedProjects: Array<{
    projectId?: string;
    name: string;
    reason: string;
    confidence: number;
  }>;
  relatedAccelerators: Array<{
    acceleratorId?: string;
    name: string;
    reason: string;
    confidence: number;
  }>;
  clarificationQuestions: string[];
  recommendedNextAction: string;
  confidence: number;
};
```

#### 4. Store provenance

Save:

- Provider
- Model
- Prompt version
- Generated timestamp
- Raw structured response
- Validation status
- User approval status

#### 5. Add analysis review

The user must be able to:

- Accept
- Edit
- Reject
- Re-run
- Answer clarification questions

### Sprint 2 acceptance tests

- Analysis is triggered only through an explicit action
- The original idea remains unchanged
- Invalid AI output is rejected safely
- Failed analysis can be retried
- Prompt version and provider are stored
- The user can approve or edit the output
- Job history is visible

---

## Sprint 3 — Project promotion and build plan

### Goal

An approved idea can become a project record with a queued local workspace job.

### Build

#### 1. Promote idea to project

Create:

- Project name
- Slug
- Initial description
- Link to originating idea
- Status `PLANNED`

#### 2. Generate initial documentation content

Create cloud-side content for:

- `idea.md`
- `product-brief.md`
- `build-plan.md`
- `architecture.md`
- `security.md`
- `roadmap.md`
- `README.md`

Store the generated content in the job payload or a dedicated artefact model.

#### 3. Queue local work

Create:

```text
type: create_local_workspace
executionTarget: LOCAL_WORKER
status: QUEUED
requiresApproval: true
```

Payload example:

```json
{
  "projectId": "project-id",
  "projectName": "Example Project",
  "slug": "example-project",
  "targetRoot": "/Users/steve/Projects",
  "files": [
    {
      "path": "README.md",
      "content": "# Example Project"
    },
    {
      "path": "docs/idea.md",
      "content": "..."
    }
  ],
  "initialiseGit": true
}
```

Do not accept arbitrary absolute paths from the cloud.

The worker must calculate and validate paths locally against its approved root.

### Sprint 3 acceptance tests

- An assessed idea can be promoted once
- A project record is created
- Documentation drafts are generated
- A local-worker job is queued
- The job requires approval
- Duplicate project slugs are handled
- Cloud payloads cannot specify paths outside the approved project root

---

## Sprint 4 — Mac worker

### Goal

A secure local process receives an approved job and creates a local workspace.

### Worker commands

```bash
npm run worker:start
npm run worker:status
npm run worker:stop
```

### Worker registration

The worker stores:

- Worker name
- macOS hostname
- Platform
- Version
- Allowed project root
- Capabilities
- Last heartbeat

Example capabilities:

```json
[
  "repository_scan",
  "file_generation",
  "git_init",
  "git_commit",
  "github_push",
  "node",
  "npm"
]
```

### Worker polling loop

1. Authenticate
2. Send heartbeat
3. Request one eligible job
4. Lock the job transactionally
5. Validate job type and payload
6. Validate approval
7. Execute the registered handler
8. Stream or upload job events
9. Return result
10. Mark completion or failure
11. Wait before polling again

### First handler: `create_local_workspace`

The handler should:

1. Sanitise the slug
2. Join it to the configured root
3. Resolve the final path
4. Confirm the resolved path remains inside the allowed root
5. Refuse to overwrite an existing directory
6. Create the project directory
7. Create `docs/`
8. Create `.eolas/`
9. Write supplied documentation files
10. Write `.eolas/project.json`
11. Return the created file list

Example output:

```text
~/Projects/example-project/
├── .eolas/
│   └── project.json
├── docs/
│   ├── idea.md
│   ├── product-brief.md
│   ├── architecture.md
│   ├── build-plan.md
│   ├── security.md
│   └── roadmap.md
├── .gitignore
└── README.md
```

### Worker security requirements

- Allowlisted job handlers only
- No arbitrary shell commands
- No `eval`
- No raw command strings supplied from the cloud
- Validate all payloads with schemas
- Block path traversal
- Refuse symlink escapes
- Restrict access to the configured project root
- Use macOS Keychain for worker credentials
- Redact secrets from logs
- Limit file sizes and job payload sizes
- Use idempotency keys
- Lock jobs before execution
- Time out long-running operations
- Record every filesystem action

### Sprint 4 acceptance tests

- Worker registers and reports online
- Worker heartbeat is visible
- Only approved jobs are claimed
- The workspace is created under the configured root
- Path traversal attempts are rejected
- Existing directories are not overwritten
- Generated files match the job payload
- Job events appear in the dashboard
- Failures are recorded and retryable

---

## Sprint 5 — Git and GitHub resilience

### Goal

A local Eolas-generated workspace is versioned and backed up off-device.

### Build

#### 1. Add local Git initialisation

Approved handler:

```text
initialise_git
```

Operations:

- `git init`
- set default branch to `main`
- add generated files
- create initial commit

#### 2. Add GitHub integration

Prefer a GitHub App with permissions limited to:

- Create repositories for the authorised account or organisation
- Read and write repository contents
- Read repository metadata

#### 3. Create private repository

Approved job:

```text
create_github_repository
```

Inputs:

- Name
- Description
- Visibility fixed to private in V0.1
- Optional organisation

#### 4. Connect and push

Approved worker handler:

```text
push_initial_commit
```

Operations:

- Add remote
- Push `main`
- Read commit SHA
- Return remote URL
- Record backup timestamp

#### 5. Add backup state

Project page should show:

```text
Local workspace: Present
Git repository: Initialised
GitHub repository: Connected
Last pushed commit: abc123
Last off-device backup: 2026-07-19 14:30
Unpushed commits: 0
```

### Sprint 5 acceptance tests

- A private GitHub repository can be created
- Initial files are pushed
- Project record contains the remote URL
- Commit SHA is stored
- Backup time is recorded
- Push failures do not lose local files
- Re-running the job does not create duplicate repositories
- Eolas distinguishes local commits from off-device backup

---

## Sprint 6 — Existing repository catalogue

### Goal

Eolas can inspect the existing `~/Projects` folder without uploading all source code.

### Scanner scope

Read initially:

- `.git` metadata
- `package.json`
- lock files
- `README.md`
- `docs/`
- `tsconfig.json`
- Next.js configuration
- Vercel configuration
- Docker files
- Prisma schema
- Supabase configuration
- top-level directory tree

Ignore:

```text
node_modules
.next
dist
build
coverage
.git
vendor
.cache
.turbo
```

### Detect

- Project name
- Local path
- GitHub remote
- Current branch
- Last commit
- Uncommitted changes
- Package manager
- Languages
- Framework
- Database technology
- Authentication libraries
- Testing tools
- Deployment configuration
- README presence
- Documentation presence

### Repository classifications

```text
ACTIVE
MAINTAINED
PROTOTYPE
PARKED
ARCHIVED
PERSONAL
CLUB
COMMERCIAL
LEARNING
WORK_SENSITIVE
```

Work-sensitive repositories must be excluded from cloud content processing unless explicitly approved.

### Sprint 6 acceptance tests

- All configured repositories are discovered
- Excluded folders are ignored
- Repository metadata is accurate
- Sensitive projects can be marked and excluded
- Source code is not uploaded by default
- Changes are detected on later scans

---

## Sprint 7 — Accelerator catalogue

### Goal

Eolas can register reusable assets and match them to ideas.

### Accelerator model

Each accelerator contains:

```text
Identity
Version
Status
Capabilities
Compatibility
Source location
Files
Dependencies
Configuration
Tests
Security status
Documentation
Projects using it
Provenance
```

### Maturity levels

```text
DISCOVERED
CANDIDATE
STANDARDISED
TESTED
REVIEWED
APPROVED
DEPRECATED
```

### First accelerators

#### 1. Documentation Pack

Contains:

- README
- Product brief
- Architecture
- Roadmap
- Security
- User guide
- ADR
- Changelog

#### 2. GitHub Baseline

Contains:

- `.gitignore`
- CI workflow
- Dependabot
- PR template
- Issue templates
- Security policy

#### 3. Next.js Baseline

Contains:

- Layout
- Error handling
- Loading state
- Environment validation
- Linting
- Tests
- Security headers

### Matching model

Match:

```text
Idea
  ↓
Required capabilities
  ↓
Available approved accelerators
  ↓
Adaptation required
  ↓
New development required
```

### Reuse estimate

Calculate from a transparent weighted model.

Example:

```text
Foundation              15%
Authentication          10%
Data layer              15%
UI shell                10%
Common forms            10%
Notifications           10%
Deployment              10%
Testing                 10%
Documentation           10%
```

Output:

```text
Available locally: 65%
Requires adaptation: 10%
Requires new development: 25%
```

Do not allow the AI to invent an unsupported percentage.

---

# 8. API and Route Plan

Suggested application routes:

```text
/
├── dashboard
├── capture
├── ideas
│   └── [id]
├── projects
│   └── [id]
├── jobs
│   └── [id]
├── workers
├── accelerators
│   └── [id]
└── settings
```

Suggested server endpoints:

```text
POST   /api/ideas
GET    /api/ideas
GET    /api/ideas/:id
PATCH  /api/ideas/:id
POST   /api/ideas/:id/analyse
POST   /api/ideas/:id/promote

GET    /api/jobs
GET    /api/jobs/:id
POST   /api/jobs/:id/approve
POST   /api/jobs/:id/cancel

POST   /api/workers/register
POST   /api/workers/heartbeat
POST   /api/workers/claim-job
POST   /api/workers/jobs/:id/event
POST   /api/workers/jobs/:id/complete
POST   /api/workers/jobs/:id/fail

GET    /api/projects
GET    /api/projects/:id
POST   /api/projects/:id/github
```

Prefer server actions for straightforward authenticated UI operations and explicit API routes for worker communication.

---

# 9. Job Types

Implement these incrementally.

## Cloud jobs

```text
analyse_idea
categorise_idea
match_projects
match_accelerators
generate_project_brief
generate_build_plan
generate_documentation_pack
```

## Local worker jobs

```text
create_local_workspace
scan_repository
write_project_files
initialise_git
create_git_branch
run_lint
run_tests
run_build
copy_accelerator
```

## External service jobs

```text
create_github_repository
record_github_metadata
trigger_vercel_deployment
```

Every handler must define:

- Input schema
- Output schema
- Execution target
- Approval requirement
- Retry policy
- Timeout
- Idempotency behaviour
- Logging behaviour
- Security restrictions

---

# 10. PWA Requirements

The mobile idea-capture experience is a core feature.

Implement:

- Web app manifest
- Application icons
- Standalone display
- Mobile viewport
- Theme colour
- Home-screen installation
- Draft persistence
- Clear online/offline state
- Retry for failed submissions

Later:

- Voice recording
- Share sheet support
- Photo capture
- URL capture
- Push notifications
- Background sync

The first interaction should remain:

```text
Open Eolas
  ↓
Type or speak idea
  ↓
Save
```

---

# 11. Security Baseline

Apply from the first sprint.

## Application

- Authenticated access only
- Secure cookies
- CSRF protection where applicable
- Input validation
- Output encoding
- Rate limiting for authentication and capture endpoints
- Content Security Policy
- Strict transport security
- Referrer policy
- Permissions policy
- Safe error responses
- Server-side authorisation checks

## Worker

- Unique worker identity
- Rotatable worker credentials
- Short-lived access token where possible
- Local root restriction
- Allowlisted handlers
- Schema-validated payloads
- No arbitrary commands
- No arbitrary paths
- Secret redaction
- Full audit events
- Replay protection
- Idempotent job execution

## GitHub

- Private repositories by default
- Least-privilege GitHub App
- Branch protection later
- Secret scanning
- Dependabot
- CI checks
- No credentials in generated content

## Data

- Original capture retained
- Audit logs retained
- Sensitive-project exclusion
- Backups tested
- Deletion and retention rules documented

---

# 12. Documentation to Create in the Repository

Create these files immediately:

```text
docs/product-brief.md
docs/architecture.md
docs/build-plan.md
docs/security.md
docs/roadmap.md
docs/decisions/ADR-001-local-first-cloud-connected.md
docs/decisions/ADR-002-cloud-and-local-job-separation.md
docs/decisions/ADR-003-capability-led-provider-model.md
docs/decisions/ADR-004-human-approval-boundaries.md
```

## ADR format

```markdown
# ADR-XXX — Decision title

## Status

Proposed | Accepted | Superseded | Rejected

## Context

What problem or decision prompted this record?

## Options considered

### Option 1

### Option 2

### Option 3

## Decision

What has been selected?

## Rationale

Why was it selected?

## Consequences

What becomes easier, harder or constrained?

## Security impact

What security or governance implications exist?

## Revisit when

What condition should trigger review?
```

---

# 13. Initial User Interface

## Dashboard

Display:

```text
Ideas in Inbox
Ideas Awaiting Review
Jobs Waiting for Mac
Worker Status
Active Projects
Recent Failures
Backup Warnings
```

## Idea card

Display:

- Title
- Raw capture preview
- Status
- Created date
- Analysis state
- Related project count
- Next action

## Job card

Display:

- Job type
- Target
- Status
- Project or idea
- Created time
- Attempt count
- Approval state
- Latest event
- Failure details

## Worker card

Display:

- Name
- Status
- Last heartbeat
- Version
- Allowed root
- Capabilities
- Current job

---

# 14. Testing Strategy

## Unit tests

Cover:

- Idea validation
- Job state transitions
- Slug sanitisation
- Path validation
- Payload schemas
- Reuse calculation
- Provider capability selection

## Integration tests

Cover:

- Create idea
- Queue analysis
- Save analysis
- Promote idea
- Queue local job
- Claim job
- Complete job
- Register GitHub backup

## End-to-end tests

Cover:

1. Mobile idea capture
2. Idea review
3. Analysis approval
4. Project promotion
5. Local worker job approval
6. Local workspace creation
7. GitHub backup status

## Security tests

Cover:

- Unauthenticated access
- Cross-user access
- Path traversal
- Symlink escape
- Malformed worker payload
- Duplicate job claim
- Replayed completion
- Oversized content
- Secret leakage in logs

---

# 15. CI Pipeline

Create `.github/workflows/ci.yml`.

Run on pull requests and pushes to `main`:

```text
Install
Format check
Lint
Type-check
Unit tests
Integration tests
Build
Prisma validation
Dependency audit
Secret scan
```

Do not automatically deploy local-worker code anywhere.

Vercel should deploy the web application only.

---

# 16. Definition of Done

A feature is not complete until:

- Requirements implemented
- Input schema validated
- Authorisation checked
- Error handling added
- Audit event recorded
- Tests added
- Documentation updated
- No secrets committed
- Build passes
- Accessibility checked
- Security impact reviewed

---

# 17. Immediate Build Order

Execute in this order.

## Step 1

Create the repository structure and documentation files.

## Step 2

Implement the Prisma schema and migration.

## Step 3

Add the Prisma client and database service layer.

## Step 4

Add authentication.

## Step 5

Build `/capture`.

## Step 6

Build `/ideas`.

## Step 7

Build `/ideas/[id]`.

## Step 8

Add the job service and job state machine.

## Step 9

Implement `analyse_idea`.

## Step 10

Add analysis review and approval.

## Step 11

Implement idea promotion to project.

## Step 12

Generate the documentation pack.

## Step 13

Create the Mac worker package.

## Step 14

Implement worker registration and heartbeat.

## Step 15

Implement job polling and locking.

## Step 16

Implement `create_local_workspace`.

## Step 17

Add Git initialisation.

## Step 18

Add GitHub private repository creation and push.

## Step 19

Add backup state and warning dashboard.

## Step 20

Start repository discovery and accelerator registration.

---

# 18. First Milestone

Stop and validate after this is working:

```text
I captured an idea on my phone
        ↓
It appeared in the hosted Eolas dashboard
        ↓
Its original wording was preserved
        ↓
I generated and approved a structured analysis
        ↓
I promoted it to a project
        ↓
My Mac worker safely created the local workspace
        ↓
The workspace was committed and pushed privately to GitHub
```

Only after this milestone should Eolas begin:

- Copying accelerator code
- Installing dependencies
- Generating application code
- Running builds
- Running security tools
- Creating deployments

---

# 19. VS Code / AI Development Instruction

Use the following as the execution instruction for the coding assistant:

```markdown
You are implementing Eolas V0.1 from the plan in this document.

Work iteratively and do not attempt to build the entire roadmap in one pass.

For each implementation step:

1. Inspect the existing repository before making changes.
2. State the specific step being implemented.
3. Identify affected files.
4. Implement the smallest complete vertical slice.
5. Validate all external inputs with typed schemas.
6. Preserve the cloud/local trust boundary.
7. Do not introduce arbitrary shell execution.
8. Do not expose secrets to the client or logs.
9. Add or update tests.
10. Run formatting, linting, type-checking, tests and build.
11. Update the relevant documentation.
12. Commit only when the step is complete and verified.

Start with:

- Repository structure
- Prisma schema
- Prisma migration
- Database service layer
- Mobile idea capture
- Idea inbox

Do not begin the Mac worker, GitHub automation, accelerator assembly or AI code generation until the initial mobile capture and idea inbox work end to end.

Where details are unclear, choose the simplest secure implementation that remains compatible with the architecture in this plan. Record significant decisions as ADRs.
```

---

# 20. Suggested First Commit Sequence

```text
chore: establish Eolas project structure
docs: add product, architecture and security documentation
feat: add initial Prisma data model
feat: add authenticated mobile idea capture
feat: add idea inbox and detail view
feat: add cloud job model and analysis workflow
feat: add idea-to-project promotion
feat: add local worker registration and heartbeat
feat: add safe local workspace creation
feat: add GitHub repository backup workflow
```

---

# 21. V0.1 Non-Goals

Do not include these in the first working release:

- Multi-user organisations
- Payments
- Public sharing
- Full source-code cloud upload
- Autonomous code changes
- Automatic production deployment
- Vector database
- Large multi-agent orchestration
- Automatic CVE remediation
- Visual component similarity
- Full Obsidian synchronisation
- Commercial billing
- Marketplace integrations

These remain roadmap items after the core Eolas loop is proven.
