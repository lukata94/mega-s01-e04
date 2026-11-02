# rig

The lane's resident service: keeps a heartbeat, serves the status board, reads the night's run
log. Hono + JSX, rendered on the server, Node 22+.

Read first: `docs/vision.md`, `docs/styleguide.md`. Decisions: `docs/adr/`.

## Commands

- `pnpm dev` / `pnpm start`: serves on `PORT` (8787). Needs `.env` (copy `.env.example`).
- `pnpm test`: vitest. `pnpm typecheck`: tsc.

## How work moves here

1. A feature starts as a plan: `plan.md` at the root (one at a time). Finished plans live in
   `docs/plans/done/`.
2. The plan is split into GitHub issues: skill `plan-to-issues` (`.agents/skills/`). A human
   reviews the split before anything is published. GitHub issues out of reach: files in
   `docs/issues/` (ADR 0004).
3. Issues are worked by workers, one issue per worker, each on its own branch or worktree.
   Pick the model per issue: the strongest for logic, a cheaper one for views and tests.
4. A worker closes its issue with a closing comment, exactly this shape:

   ```
   done: <what changed, one line>
   worker: <harness> · <model> · <effort>
   commit: <sha or "none">
   ```

5. An issue is closed only when its "Done when" holds. If it can't hold yet, leave it open and
   say what it waits on.

## Issue shape

Decided by the repo owner on 2026-11-02, for every issue split from a plan. The
`plan-to-issues` skill reads this instead of asking again.

```
Source: plan.md § <n>

## Scope
<what to build, taken from the plan>

## Done when
<one checkable condition from the plan>

## Blocked by
#<n>, #<n>  (real issue numbers, or "Nothing.")

## Worker
<model tier: the strongest for logic, a cheaper one for views and tests>
```

- Label every issue `plan:<plan name>` (this plan: `plan:morning-digest`).
- Create issues in dependency order, so "Blocked by" cites real numbers.
- A step that waits on someone outside (a reviewer, a host) is its own issue. It stays open
  until that person has confirmed. Do not close it, and do not do the step after it, on a guess.
- Close with the comment shape above, citing a sha that is on the remote. Close only after the
  owner said yes.

## Skills

Shared skills live in `.agents/skills/`, one folder each, `SKILL.md` inside. That folder is the
one source for every harness on the team. If yours loads skills from somewhere else, point it
here (a link or a config entry). Don't copy: copies drift.

## Rules

- Never commit `.env`, tokens or previews.
- Don't touch `runs/`: those are real nights, read-only fixtures.
- No client JS (ADR 0001).
