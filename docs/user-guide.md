# User guide

## Capture and incubate an idea

1. Open **Capture** or **Mobile capture**.
2. Enter the idea in your own words. Add a title and summary if useful.
3. Open the saved idea and use **Idea workspace** for notes and **Build brief** for a build-ready description.
4. AI brainstorming is a suggestion only. Review it before adding it to your notes.

## Validate before building

On the idea page, complete the **Validation gate**:

- score problem clarity, evidence strength, and effort from 1–5;
- record the riskiest assumption;
- define the smallest useful test;
- explain the decision and add evidence links where relevant.

Choose **Ready to build** only when you want to create a project. Eolas blocks promotion until the latest decision is `BUILD`.

## Make an assembly plan

1. Select compatible accelerators on the idea page. Start with **Next.js app baseline** for a runnable web-project foundation.
2. Choose **Promote to project**.
3. Review the plan's accelerator versions, file/line reuse, immutable hash, and conflicts in the project screen.
4. Resolve conflicts by selecting a different set or improving the accelerators. Approve only a conflict-free plan.

## Build the project locally

1. Approve the plan. This queues local workspace creation.
2. Open **Jobs** and watch its audit trail.
3. Once the workspace is complete, open the project and schedule these stages in order:
   - dependency installation;
   - production build;
   - local Git commit;
   - optional GitHub backup.
4. Each scheduled stage appears as a pending job. Approve it separately in **Jobs**.

## Back up to GitHub

Create a private repository yourself, then paste its HTTPS or SSH URL into the project page. Schedule and approve **GitHub backup**. Eolas will only use GitHub URLs and will never replace a different existing `origin` remote.

## Read status

- **Ideas** shows capture and validation state.
- **Projects** shows plans, local path, stages, commit state, and GitHub backup information.
- **Jobs** shows pending approvals, worker state, errors, retries, and audit events.
- **Accelerators** shows approved reusable units plus local discovery candidates.
