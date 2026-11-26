# Changelog

## [Unreleased]

### Added
- **`retro` skill:** end-of-project retrospective that turns what had to be repeated or kept breaking into concrete toolkit changes, saved in `RETRO.md` and optionally as GitHub issues.

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
