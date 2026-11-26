---
name: release-checklist
description: Step-by-step release of a new version of the current project (tests, version bump, changelog, commit, tag, push, publish), stopping for explicit confirmation before anything public.
disable-model-invocation: true
argument-hint: "[patch|minor|major]"
---

# Release checklist

Go through these steps **in order**. Before each step, show a one-line status (`✅ 2/9 Tests pass`). **Stop at the first failure**: explain it, suggest a fix, and don't continue until the user says so.

## 1. Working tree clean?

Run `git status`. If there are uncommitted changes, list them and stop: they must be committed or stashed first. Check you are on the default branch (`main`); if not, say so and ask.

## 2. Tests pass?

Find the project's test command (`package.json` scripts, `pyproject.toml`, `Makefile`, `node --test tests/`, `pytest`…) and run it. No tests at all: say so and ask whether to continue anyway.

## 3. Choose the version

- Show the current version (from the manifests) and the last tag (`git describe --tags --abbrev=0`, if any).
- Read the commits since the last tag (`git log <last-tag>..HEAD --oneline`, or all commits if there's no tag).
- Propose **patch** (fixes only), **minor** (new features, nothing broken) or **major** (breaking changes; before 1.0.0, a minor bump is enough), with a one-line reason.
- If the user passed `patch`, `minor` or `major` as the argument, use it, but say if the commits suggest otherwise. Otherwise wait for their choice.

## 4. Bump the version everywhere

Update every manifest that holds the version: `package.json` (+ lockfile via the package manager), `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (both the metadata and the plugin entry), `pyproject.toml`, `Cargo.toml`… Then search the repo for the **old** version string and list any other file that still hard-codes it; ask before changing those.

## 5. Update CHANGELOG.md

Add a new section at the top (create the file if needed, with a `# Changelog` heading):

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- …
### Changed
- …
### Fixed
- …
```

Build it from the commits since the last tag, rewritten in plain words for a user (not commit hashes). Drop empty subsections. Show it and let the user edit it.

## 6. Commit

Commit the version bump and changelog: `Release vX.Y.Z`.

## 7. ⚠️ STOP: confirmation before anything public

Show a summary: version, changelog section, and exactly what the next steps will do (the tag name, the branch and remote that will be pushed, the publish command if any). Ask: **"Push and tag vX.Y.Z now?"** Do nothing until the user explicitly says yes. If they say no, leave the local commit in place and explain how to undo it (`git reset --soft HEAD~1`).

## 8. Tag and push

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push
git push origin vX.Y.Z
```

## 9. Publish (only if the project has a publish step)

`npm publish`, `python -m build && twine upload`, a GitHub release (`gh release create vX.Y.Z --notes-file <changelog section>`)… Show the exact command first and ask again before running it. For a Claude Code plugin there is nothing to publish: pushing the tag is enough, users update with `/plugin marketplace update`.

## Done

Reply with: the version, the tag, links (repo, release), and anything left to do by hand.
