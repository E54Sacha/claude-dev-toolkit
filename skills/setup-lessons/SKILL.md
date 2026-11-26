---
name: setup-lessons
description: Sets up the lessons repo used by the tutor subagent (creates a new lessons folder from the template, or connects an existing one) and saves its path in ~/.claude/lessons.json. Use when the user runs it, when the session says no lessons repo is configured, or when the user wants to change where lessons are saved.
---

# Set up the lessons repo

The `tutor` subagent saves every lesson in a **lessons repo**: a folder with `<subject>/<topic>/<lesson>.html` pages, their `.quiz.json` files, a shared style and an `index.html`. Its path is stored in `~/.claude/lessons.json`.

## Step 1: Ask

Ask the user (question tool if available):

- **Create a new lessons folder** (recommended for a first install). Suggest `<home>/lessons` as the default location and let them pick another.
- **Use an existing lessons repo** (a folder that already has a `.lessons-repo` file, e.g. a clone of their lessons repo from GitHub).

## Step 2: Run the setup script

Run, with the absolute folder path:

```bash
node "<this skill's folder>/setup.mjs" "<absolute folder path>"
```

It creates the folder from the template (if needed), runs `git init` with a first commit, and writes `~/.claude/lessons.json`. It prints one JSON line with what it did. If it refuses (non-empty folder that isn't a lessons repo), tell the user why and ask for another folder.

## Step 3: Publishing (optional)

New lessons are committed automatically, but only **pushed** if the repo has a remote. Offer to create one: `gh repo create <name> --public --source "<folder>" --push` (only with the user's explicit OK, and only if `gh` is installed and logged in). To read lessons online, they can then turn on GitHub Pages for the repo.

## Step 4: Hand off

Tell the user:

- where lessons will be saved, and that the setting is in `~/.claude/lessons.json`;
- to **restart Claude Code** (the path is read when a session starts);
- how to try it: *"teach me about <any topic>"*.
