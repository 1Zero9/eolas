# Accelerator contract

An accelerator is a small, reviewed, Git-versioned implementation unit. It is not a discovered repository snapshot or a prompt.

Each `accelerators/<slug>/accelerator.json` must provide:

- `name`, `version` (semantic versioning), `description`, and `category`;
- capability and provided-capability tags;
- supported target stacks, package dependencies, and declared accelerator conflicts;
- a `files/` directory containing the exact reusable implementation.

`nextjs-app-baseline` is the current foundation accelerator. Select it for a runnable Next.js starting workspace; stack database, PWA, authentication, AI, and UI accelerators on top when their file ownership is compatible.

When an idea is promoted, Eolas reads a snapshot of the selected accelerator files and calculates SHA-256 hashes, line/file reuse coverage, and collisions. That snapshot becomes an immutable assembly plan. The local worker only writes a plan after it is explicitly approved, and records the plan ID and hash in `.eolas/project.json`.

Reuse coverage means accelerator-originated implementation lines divided by all planned implementation lines. Documentation is excluded; the metric intentionally describes the current approved plan, not an estimate of future hand-written or agent-generated code.

To improve an accelerator, make a reviewed Git change and bump its version. Existing plans deliberately retain their original snapshot, so a later accelerator update cannot silently change an approved build.

The discovery scanner deliberately sends only paths, sizes, and SHA-256 hashes to Eolas Cloud. It never uploads repository source code or credentials. Review candidates locally, then create a new reviewed accelerator in this repository when a pattern is worth preserving.
