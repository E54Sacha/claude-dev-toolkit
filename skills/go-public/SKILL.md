---
name: go-public
description: Safely makes a private GitHub repo public: checks every commit's author email and the history for secrets, rewrites only what's needed, force-pushes with an explicit safety check, verifies on GitHub, then changes the visibility. Stops for confirmation before every irreversible step.
disable-model-invocation: true
argument-hint: "[owner/repo]"
---

# Go public

Goal: a repo becomes public with **no personal email and no secret anywhere in its history**. Once public, anything pushed can be copied or cached within minutes, so order matters: clean, push, verify, and only then flip the visibility.

Go through the steps **in order**. Show a one-line status before each (`✅ 3/8 History clean`). **Stop at the first failure** and explain it.

**Rules for every command in this skill:**
- Run each critical command **on its own**: no `&&` chains, no pipes (`| tail`) that hide a failure and let the next command run anyway.
- Never use `git push --force` without an explicit lease: `--force-with-lease=<branch>:<expected sha>`.
- Never print a secret you find: show the file, the commit and the kind of secret, with the value masked.

## 1. Which repo, and is it clean?

- The repo is the current directory, or the argument (`owner/repo`). `gh repo view <repo> --json name,visibility,defaultBranchRef,url`. Already public: say so and stop.
- `git status`: uncommitted changes → stop, they must be committed or stashed first.
- `git fetch origin`, then confirm the local default branch equals `origin/<branch>` (`git rev-parse <branch> origin/<branch>`). If they differ, stop and ask: the remote has commits you don't, or you have unpushed ones.

## 2. Find the user's public email

The safe address is GitHub's noreply one: `gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"'`. Also read `git config user.email`; if it isn't the noreply address, say so (future commits would expose the email again) and offer to set it for this repo or globally.

## 3. Check every author and committer

`git log --all --format='%h %ae %ce %s'` and list every address that isn't a noreply address (`…@users.noreply.github.com`, `noreply@github.com`, bots). Commits made on github.com's website often carry the personal email.

Also list the **remote** branches that exist only on GitHub (`git ls-remote --heads origin`), since they become public too.

## 4. Scan the history for secrets

Search **all** commits, not only the current files:

- Files that should never be committed, in any commit: `git log --all --diff-filter=A --name-only --format=` filtered for `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `id_rsa*`, `credentials*.json`, `*.sqlite`/`*.db` with real data.
- Secret-looking values in the diffs: `git log --all -p` searched for API key prefixes (`sk_live_`, `sk-`, `re_`, `ghp_`, `github_pat_`, `AKIA`, `xox[bp]-`, `npg_`), private key headers (`-----BEGIN … PRIVATE KEY-----`), and URLs with an embedded password (`://user:password@host`, ignoring obvious local examples like `user:pass@localhost`).
- Personal data the user wouldn't want public: phone numbers, home address, date of birth (in CVs, fixtures, screenshots).

**Found a real secret:** stop. Rewriting history doesn't make it safe, since it may already be copied. The user must **revoke or rotate it first** at the service that issued it; then it can be removed from the history (`git filter-repo --replace-text` if installed, otherwise explain the options). Continue only once the user confirms it's revoked.

## 5. Rewrite the author emails (only if step 3 found some)

Show exactly which commits will change and that **every commit ID from the first changed one onwards will change** (open pull requests, forks and links to old commit IDs break; Vercel, Render and similar services just follow the branch). Ask: **"Rewrite these N commits to <noreply address>?"** and wait for a yes.

Then:

1. Write down the current remote SHA: `git rev-parse origin/<branch>`.
2. Rewrite **only the branch to publish**, not `--all` (that would also rewrite `refs/remotes/origin/*` and make the lease below useless):
   ```bash
   FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --env-filter '
   if [ "$GIT_AUTHOR_EMAIL" = "<old>" ]; then export GIT_AUTHOR_EMAIL="<noreply>"; fi
   if [ "$GIT_COMMITTER_EMAIL" = "<old>" ]; then export GIT_COMMITTER_EMAIL="<noreply>"; fi
   ' -- <branch>
   ```
   (`git filter-repo --mailmap` is better if it's installed.)
3. Check the result: `git log <branch> --format='%ae %ce' | sort -u` shows only safe addresses, and the files are untouched: `git rev-parse <old sha>^{tree}` equals `git rev-parse <branch>^{tree}`.

Other local branches or tags with the old email: list them and ask whether to rewrite or delete them; never publish them unchanged.

## 6. ⚠️ STOP: confirmation before the force-push

Show: the branch, the old and new SHA, the number of rewritten commits. Ask **"Force-push <branch> now?"** and wait for a yes. Then, alone:

```bash
git push --force-with-lease=<branch>:<sha from step 5.1> origin <branch>
```

If it's rejected, **stop**: someone pushed in the meantime. Fetch, look, and start again from step 3. Never retry with plain `--force`.

## 7. Verify on GitHub, not locally

- `gh api "repos/<owner>/<repo>/commits?sha=<branch>&per_page=100" --jq '.[] | "\(.commit.author.email) \(.commit.committer.email)"' | sort | uniq -c` (page through if there are more than 100) → only safe addresses.
- The same check for every other remote branch from step 3.
- `git rev-parse <branch> origin/<branch>` are equal.

Anything unexpected: stop. The repo is still private, nothing has leaked.

## 8. ⚠️ STOP: make it public

Summarize what was checked (authors, secrets, branches). Ask **"Make <owner>/<repo> public now?"** and wait for a yes. Then, alone:

```bash
gh repo edit <owner>/<repo> --visibility public --accept-visibility-change-consequences
```

Confirm with `gh repo view <owner>/<repo> --json visibility`.

## Done

Reply with: the repo URL, what was rewritten (or "nothing needed"), the secret scan result, and one prevention tip if emails had to be rewritten: *GitHub → Settings → Emails → tick "Keep my email addresses private" and "Block command line pushes that expose my email"*, so commits made on github.com stop using the personal address.

If the old commits were ever pushed to a **public** repo (even briefly), say so: GitHub can keep them reachable by their ID for a while, and GitHub Support can purge cached views on request.
