---
description: Hotfix workflow — branch off main, surgical fix, PR to main, cherry-pick into dev, assign Pete + status comment
---

When the user invokes `/hotfix [optional short description]`, execute the GitFlow hotfix workflow.

Stackr uses GitFlow: `main` is the production branch, `dev` is the integration branch, and every feature PR targets `dev`. **Hotfix is the only workflow where a PR targets `main` directly** — it bypasses `dev` to land a surgical fix on production fast, then the same fix is cherry-picked back into `dev` so the branches stay aligned.

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
   - **Follow-up** — note the cherry-pick to `dev` that needs to follow
   - Title + summary only. No "Generated with..." footer, no Test Plan section.

8. **Assign Pete** so it lands on his dashboard: `gh pr edit <N> --add-assignee pete-watters`. GitHub rejects review requests on self-authored PRs, so assignee is the visibility signal.

9. **Status comment** opening with `@pete-watters`. Shape:
   - **Shipped** — bullets of what landed in this PR
   - **Pending / decisions needed** — blockers, smoke-test asks
   - **Verification** — CI status, any manual steps Pete needs to take

10. **After merge: cherry-pick into dev.** Open a follow-up PR `chore/sync-<short-name>-into-dev` targeting `dev` that cherry-picks the hotfix commit. This keeps `dev` and `main` aligned. Restore any stashed WIP after.

## Notes

- Every other PR (features, chores, docs) targets `dev`. Hotfixes are the only PRs that target `main`.
- Releases happen by opening a PR `dev → main` with a tag at the merge commit (driven by release-please or manually).
- Branch protection is not enforced via GitHub (Free tier). Discipline replaces enforcement — never direct-push to `main` or `dev`.
- If `gh pr create` returns a URL, surface it prominently in the user-facing message so they can tap to merge.
- Cloudflare deploys are triggered by pushes to `main` only.
