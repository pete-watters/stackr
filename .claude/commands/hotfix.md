---
description: Hotfix workflow — branch off main, surgical fix, PR to main, assign Pete + status comment
---

When the user invokes `/hotfix [optional short description]`, execute a hotfix on `main`.

Stackr uses trunk-based development — `main` is the integration branch and there is no `dev`. Every PR (including hotfixes) targets `main`. A "hotfix" here means a small surgical fix that bypasses the usual feature-branch cadence because something is broken on the deployed site.

## Steps

1. **Check working tree.** Run `git status --short`. If there are uncommitted changes on the current branch, stash them with `git stash push -u -m "WIP before hotfix"` and remember to restore later.

2. **Fetch + branch off main.** Run `git fetch origin main`, then `git switch -c hotfix/<short-name> origin/main`. If the user didn't supply a short-name as an argument, ask for one via AskUserQuestion. Use kebab-case (e.g. `fix-coingecko-rate-limit`, `revert-bad-query`).

3. **Identify + apply the fix.** Confirm the root cause with the user before editing. Apply the _minimum surgical patch_ — no surrounding cleanup, no opportunistic refactors.

4. **Verify locally** — run the relevant subset of `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` on the affected package. If a hook fails, never use `--no-verify` silently — surface it and ask.

5. **Commit** with a conventional-commit message scoped to the affected area: `fix(<scope>): <short description>`. Include a `Type: hotfix` trailer in the body.

6. **Push the branch.** `git push -u origin hotfix/<short-name>`.

7. **Open PR to main** with `gh pr create --base main --head hotfix/<short-name>`. PR body shape:
   - **Summary** — what changed and why (1-3 bullets)
   - **Trade-off** — what we lose temporarily, if anything
   - **Verification** — what CI will catch, manual smoke-test steps
   - **Follow-up** — any longer-term work this defers
   - Title + summary only. No "Generated with..." footer, no Test Plan section.

8. **Assign Pete** so it lands on his dashboard: `gh pr edit <N> --add-assignee pete-watters`. GitHub rejects review requests on self-authored PRs, so assignee is the visibility signal.

9. **Status comment** opening with `@pete-watters`. Shape:
   - **Shipped** — bullets of what landed in this PR
   - **Pending / decisions needed** — blockers, smoke-test asks
   - **Verification** — CI status, any manual steps Pete needs to take

10. **After merge:** restore any stashed WIP on the original branch.

## Notes

- Branch protection is not enforced via GitHub (Free tier). Discipline replaces enforcement — never direct-push to `main`.
- If `gh pr create` returns a URL, surface it prominently in the user-facing message so they can tap to merge.
- Cloudflare Pages auto-deploys `main`.
