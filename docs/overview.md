# Eolas in plain English

Eolas is a personal system for turning a thought into a project without losing the thought or repeatedly rebuilding the same technical foundations.

## The problem it solves

Ideas are usually captured quickly, then get buried. When one is worth building, the original reasoning is often scattered between notes, prompts, and code. Starting from zero also means spending time and AI tokens recreating authentication, database setup, PWA support, and other known-good pieces.

Eolas keeps those stages connected.

## Two experiences, one system

Every organisation has a passcode-gated capture PWA at `/o/<organisation-name>`. It is intentionally small: enter the passcode, capture an idea, and leave. It does not expose other ideas, projects, jobs, accelerators, or admin controls.

The authenticated **Admin** workspace is where an operator reviews that organisation's ideas, validates them, assembles builds, approves jobs, and manages backups. Organisations never share these records.

## The journey of an idea

1. **Capture** — save an idea from the web or mobile interface. The original capture stays attached to the idea.
2. **Incubate** — add working notes, brainstorm suggestions, and a build brief.
3. **Validate** — record what evidence exists, the riskiest assumption, the smallest useful test, effort, and a deliberate decision: validate, build, park, or reject.
4. **Plan** — select reusable accelerators. Eolas creates a frozen list of exact files, versions, hashes, conflicts, and code-reuse coverage.
5. **Build locally** — after approval, the Mac worker creates the workspace. Later approvals install dependencies, run the build, and create a Git commit.
6. **Back up** — optionally approve a push to an existing private GitHub repository.

## What an accelerator is

An accelerator is a small, reviewed piece of working implementation kept in this repository. It has a version and a clear purpose. For example, the current catalogue includes a Next.js foundation, Prisma/Postgres setup, PWA support, cookie-session auth, a Gemini wrapper, and a UI component.

Accelerators are not prompts and are not automatically copied from random projects. They are reviewed, versioned building blocks.

## What “70% reuse” means

Eolas measures the share of implementation lines in an approved plan that come from accelerators. It excludes documentation and does not claim to predict future custom or AI-generated code. The dashboard shows measured reuse across real approved plans, not a decorative target.

## What Eolas does not do yet

Eolas does not create GitHub repositories, provision third-party services, deploy applications, or autonomously generate an application. Those need their own credentials, policy, and approval boundaries. It does create a reliable, reviewable foundation for those next steps.
