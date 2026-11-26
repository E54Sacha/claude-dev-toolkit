---
name: retro
description: End-of-project retrospective that turns what went wrong or had to be repeated into concrete improvements for claude-dev-toolkit (new skill, better description, hook or subagent), saved in RETRO.md and optionally as GitHub issues. Use when the user finishes a project or a milestone, or says "retro", "retrospective", "what should I improve", "what did I keep repeating", "improve my toolkit".
---

# Project retrospective → toolkit improvements

Goal: after each project, find what the user had to **repeat** to Claude or what Claude kept **getting wrong**, and turn each into one concrete change to the toolkit. This is how the toolkit grows with every project.

## Step 1: Gather evidence (read, don't ask yet)

- `LEARNINGS.md`, `REQUIREMENTS.md` (what was planned vs what exists), `README.md`, `CHANGELOG.md` in the current project.
- `git log --oneline` of the project: look for repeated fixes, reverts, "fix again", many commits on the same file.
- This conversation, if it covers the project: corrections the user made more than once, instructions they typed again, things Claude forgot, tools that failed.

Write down 3 to 6 **observations**, each tied to evidence ("You told Claude 3 times to keep lessons short: commits 1d5a088, 6157ed0…").

## Step 2: Ask the user

Ask these three questions in one message (question tool if available), each with your best guess from Step 1 as the recommended answer:

1. What did you have to **repeat** to Claude?
2. What mistake did Claude **keep making**, or what broke?
3. What was **slow or annoying** and could be automated?

## Step 3: Turn each problem into one change

Use this table:

| If… | Then add… |
|---|---|
| The same instructions were typed twice | A new skill, or a section in an existing one |
| Claude used the wrong skill, or none | A better `description` (the words the user actually types) |
| Something must happen every time, no exceptions | A hook |
| A task floods the conversation with file reads | A subagent |
| A rule was broken by an agent | A check in a hook (code beats instructions) |

For each proposed change, give: **what** (one line), **where** in the toolkit (`skills/<name>/SKILL.md`, `hooks/…`), **size** (S < 30 min, M < 2 h, L more) and **version bump** (patch = fix or wording, minor = new skill, hook or agent). Propose 1 to 5 changes, most useful first. Let the user pick.

## Step 4: Save

1. Write `RETRO.md` at the project root (append a new dated section if it exists):

   ```markdown
   ## Retro YYYY-MM-DD: <project name>

   ### What happened
   - <observation, with evidence>

   ### Toolkit changes
   - [ ] <change> (where · size · patch/minor)
   ```

2. Offer to open one GitHub issue per chosen change on the toolkit repo, so they become the backlog:
   `gh issue create -R E54Sacha/claude-dev-toolkit --title "<change>" --body "<why, evidence, where, size, draft CHANGELOG line>"`
   Only with the user's explicit OK, and only if `gh` is installed and logged in. Show the titles first.

## Step 5: Hand off

Reply with: the `RETRO.md` path, the chosen changes (and issue links if created), and the next step: *"Open the toolkit repo and say: implement the retro changes"*. When they are done, `/claude-dev-toolkit:release-checklist` ships them as a new version.
