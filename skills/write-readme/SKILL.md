---
name: write-readme
description: Writes or rewrites a project's README.md from a standard portfolio template (pitch, demo GIF slot, badges, features, architecture diagram, how to run, what I learned). Use when the user asks for a README, to document the project, to "make the repo presentable", or to prepare the repo for recruiters. Do not use for code comments, API docs or CHANGELOG entries.
---

# Write a README

Goal: a README a recruiter can skim in 30 seconds and a developer can follow to run the project. **Everything in it must be true today.**

## Step 1: Read the project

Read before writing anything:

- Manifests and config: `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `*.csproj`, `.claude-plugin/plugin.json`, `Dockerfile`, CI files in `.github/workflows/`.
- Entry points and the main folders (use Glob to see the structure, then read the key files).
- `REQUIREMENTS.md`, `LEARNINGS.md`, `CHANGELOG.md`, `LICENSE` and the current `README.md`, if present.
- Test files: how tests are run, if there are any.

## Step 2: Fill the template

Read `template.md` (same folder as this file) and fill every `{{...}}`. Remove a section only if it truly doesn't apply (e.g. no tests); never leave a `{{...}}` behind.

Rules:

1. **Never invent.** Only list features that exist in the code right now. If `REQUIREMENTS.md` lists something not built yet, leave it out (or put it under "What I'd do differently" as a next step). Never invent numbers (users, stars, scores, speed).
2. **Pitch:** one sentence, no buzzwords ("A CHIP-8 emulator that runs 1970s games in your browser", not "A revolutionary, cutting-edge platform").
3. **Badges:** 3 to 6, from shields.io (`https://img.shields.io/badge/<Name>-<hex>?logo=<simple-icons-slug>&logoColor=white`), only for the main technologies actually used.
4. **Features:** 3 to 6 bullets, each phrased as something a user can do.
5. **Architecture diagram:** Mermaid `flowchart` (GitHub renders it). Show the real components and the data flow between them, max ~10 nodes, short labels. Quote labels with special characters: `A["Hook (Node)"]`.
6. **Run it locally:** commands the reader can copy-paste in order, from `git clone` to a running project. Use the real script names from the manifests. Mention required versions.
7. **What I learned / what I'd do differently:** take them from `LEARNINGS.md` if it exists. Otherwise, write 2-3 short drafts and mark each with `<!-- TODO: check this is true for you -->`: only the user knows what they learned.
8. **Placeholders** for what only the user can provide, as HTML comments starting with `TODO:` (demo GIF, live URL, screenshots).
9. Plain, short sentences. English unless the user asks otherwise.

## Step 3: Show before writing

- **No README yet:** write `README.md` at the project root.
- **A README exists:** show a short summary of what would change (sections added, removed, rewritten) and ask before overwriting. Keep anything the user wrote by hand that is still true (credits, special instructions), and say so.

## Step 4: Hand off

Reply with:

- The file path.
- The list of `TODO:` placeholders left for the user (demo GIF, things to confirm).
- Anything you were unsure about (e.g. "I couldn't find how to run the tests").
