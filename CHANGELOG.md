# Changelog

## [Unreleased]

### Added
- **`go-public` skill:** makes a private repo public safely: author emails and secrets checked across the whole history, only the needed commits rewritten, force-push with an explicit lease, verification on GitHub, then the visibility change, each irreversible step confirmed first (from the habit-tracker retro).
- **Test gate hook:** before Claude runs `git commit`, runs the repo's tests (pytest with the folder's own `.venv`, `npm test` scripts, at the root and one level down) and blocks the commit with the failing output if they fail. Opt-in per repo through `~/.claude/test-gate.json`, since running tests runs the repo's code; a virtual environment committed inside the repo is never run.

## [0.2.0] - 2026-11-27

### Added
- **`retro` skill:** end-of-project retrospective that turns what had to be repeated or kept breaking into concrete toolkit changes, saved in `RETRO.md` and optionally as GitHub issues.
- **`add-project-to-portfolio` skill:** writes or updates a finished project's card on my portfolio (pitch, proof metrics, tech badges, links, in English and French) using only checkable facts, prints a resume bullet, sets the GitHub description and topics, then lints, builds, commits and pushes the site.

## [0.1.0] - 2026-11-26

First release.

### Added
- **`scope-project` skill:** turns a project idea into a `REQUIREMENTS.md`: asks grouped questions first, pushes back when the scope doesn't fit the time budget, then fills a fixed template with a day-by-day plan.
- **`tutor` subagent:** teaches any topic (code from the project, or CS, maths, physics, chemistry…) in a short, illustrated beginner lesson with a quiz in mixed formats, saved to your lessons repo.
- **`lessons-sync` hook:** checks every new lesson's quiz, rebuilds the lessons home page, then commits and pushes the lesson automatically. A broken quiz is never published: the errors go back to the tutor.
- **`setup-lessons` skill and session-start hook:** create a lessons repo from a template (or connect an existing one); its path is saved in `~/.claude/lessons.json` and given to the tutor at the start of each session.
- **Format hook:** after every edit, formats the file with the project's own Prettier or with Ruff, and does nothing when they aren't installed. Never uses a shell, never runs binaries from outside the project or planted inside it.
- **`write-readme` skill:** writes a portfolio-ready README from a template, using only what really exists in the code, and asks before overwriting.
- **`learning-log` skill:** proposes what you learned in the session and appends the entries you keep to `LEARNINGS.md`.
- **`interview-prep` skill:** mock interview on your own project, 10 questions one at a time, each answer graded, with a final score and topics to revise (`harder` for mid-level).
- **`release-checklist` skill:** step-by-step release (tests, version, changelog, tag, push) that stops for confirmation before anything public; only starts from its slash command.
- 19 tests (`node --test tests/`): quiz checks, format hook, lessons setup.
