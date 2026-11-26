# How the scope-project skill works

> Files covered: `skills/scope-project/SKILL.md`, `skills/scope-project/template.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

## In one paragraph

When you have a vague idea ("I want to build a portfolio site"), it's tempting to start coding right away and end up with a project that is too big to finish. The `scope-project` skill stops that from happening. It is a set of written instructions that Claude Code loads automatically when you describe a new project idea. Claude follows them in four steps: ask you everything it needs to know, check whether the plan fits your time budget, write a `REQUIREMENTS.md` file from a fixed template, and then hand the plan back to you before writing any code. The repo is packaged as a plugin, so you install it once and the skill is available in every project.

## Concepts involved

- **Plugin:** a folder that bundles extensions for Claude Code (skills, agents, hooks), described by a `plugin.json` manifest. Where it appears here: `.claude-plugin/plugin.json:1-13`.
- **Manifest:** a small JSON file that tells a tool what a package is called, which version it is, and who made it. Where it appears here: `.claude-plugin/plugin.json:2-3` (`name`, `version`).
- **Marketplace:** a catalog file listing one or more plugins and where to find them, so `/plugin install` knows what to fetch. Where it appears here: `.claude-plugin/marketplace.json:11-18`.
- **Skill:** a folder holding a `SKILL.md` file, which has a short header (when to use me) and a body (what to do). Claude reads it like a recipe. Where it appears here: `skills/scope-project/SKILL.md`.
- **Frontmatter:** the block between the two `---` lines at the top of a Markdown file, written in YAML (a simple `key: value` format). It holds metadata, not content. Where it appears here: `skills/scope-project/SKILL.md:1-4`.
- **Progressive disclosure:** loading information in layers, only when needed, instead of all at once. Here: the description is always loaded, the body only when the skill triggers, the template only in Phase 3. Where it appears here: `SKILL.md:3` (layer 1), `SKILL.md:6-57` (layer 2), `SKILL.md:39` pointing to `template.md` (layer 3).
- **Context window:** the limited amount of text a language model can "see" at once. Everything loaded into it costs space and attention. This is the reason progressive disclosure matters.
- **Placeholder:** a marked spot in a template meant to be replaced by real content. Here they look like `{{...}}`. Where it appears here: `template.md:1`, `template.md:17`, and so on.
- **Definition of done:** a list of checks that, once all true, mean the project is finished. Stops "one more feature" forever. Where it appears here: `SKILL.md:22`, `template.md:48-54`.

## Why this approach

### Part 1: How Claude Code finds the skill

There is no code that "registers" the skill. Discovery works by **folder conventions**, meaning files are found because they sit at agreed-upon paths:

1. **The marketplace makes the repo installable.** `marketplace.json` lists one plugin named `claude-dev-toolkit` with `"source": "./"` (line 14). `./` means "the plugin is this same repo, at its root". So the repo is both the catalog and the only item in it. The user runs `/plugin marketplace add E54Sacha/claude-dev-toolkit`, then `/plugin install claude-dev-toolkit@claude-dev-toolkit` (the format is `plugin@marketplace`, documented in `PLAN.md:15-16`).
2. **The plugin manifest identifies the plugin.** `plugin.json` gives the name and version. Notice it does **not** list any skills. Claude Code looks for a `skills/` folder at the plugin root by default and treats every subfolder with a `SKILL.md` as a skill. That's why `skills/scope-project/` and `skills/hello/` both work with no extra config.
3. **The plugin name becomes a namespace.** A namespace is a prefix that prevents name clashes between plugins. The skill can be called by hand as `/claude-dev-toolkit:scope-project` (plugin name + `:` + skill `name` from `SKILL.md:2`).

### Part 2: How Claude decides to use it (triggering)

At startup, Claude Code reads **only the frontmatter** of every installed skill and puts each `name` + `description` into Claude's context. The body is not loaded yet. When you type a message, Claude compares it to those descriptions and, if one matches, loads that skill's body.

So the `description` on `SKILL.md:3` is doing the job of a router. It has three deliberate parts:

- **What it does:** "Turns a project idea into a REQUIREMENTS.md by asking questions first..."
- **When to use it, with literal trigger phrases:** "new project idea", "I want to build", "plan this", "what should v1 include". Giving the exact words people say makes matching much more reliable than an abstract summary would.
- **When NOT to use it:** "Do not use for changes to code in an existing project, bug fixes, or single features." Without this, "I want to build a login button" could wrongly trigger a full project-scoping interview.

### Part 3: Progressive disclosure, the three layers

| Layer | What | When it enters the context window | Size |
|---|---|---|---|
| 1 | `name` + `description` (`SKILL.md:2-3`) | Always, in every session | ~1 paragraph |
| 2 | Body of `SKILL.md` (lines 6-57) | Only when the skill triggers | ~50 lines |
| 3 | `template.md` | Only when Phase 3 says "Read `template.md`" (`SKILL.md:39`) | ~60 lines |

Because layer 1 is tiny, you could install dozens of skills without filling Claude's context. And the template is kept out of the way during Phases 1 and 2, where it would only distract Claude into writing the file too early.

### Part 4: The four phases

The body is a **state machine in plain English**: a list of stages with clear rules for moving to the next one. Line 8 sets the global rule: "Work through the four phases in order. Never skip a phase, and never write a file before Phase 3."

- **Phase 1, Understand (`SKILL.md:10-24`).** Ask the 7 questions (goal, why, must-haves, nice-to-haves/out of scope, time budget, tech constraints, definition of done) in **one grouped message**, each with a recommended answer. Don't re-ask what the user already said. One follow-up maximum for vague answers. This feeds every section of the template.
- **Phase 2, Challenge (`SKILL.md:26-35`).** Estimate each must-have in hours, add 20% overhead, compare with the budget. Three branches: over by more than 20% means propose cuts and wait; well under means suggest one standout feature; close means move on. Also flag risky tech. The **gate** is line 35: no Phase 3 until the user agrees.
- **Phase 3, Write (`SKILL.md:37-47`).** Read the template, fill every placeholder, delete lines that don't apply, apply four quality rules, save to `REQUIREMENTS.md`. Safety check: if the file exists, show what would change and ask first.
- **Phase 4, Hand off (`SKILL.md:49-57`).** Short reply (path, 5-line summary, "Start Day 1?") and a second gate: no coding until the user says yes.

### Part 5: How the phases map onto the template

Each answer and each Phase 2 result has a fixed home in `template.md`:

| Template section | Filled from |
|---|---|
| Pitch, time budget (`template.md:3-5`) | Phase 1 Q1 + Q5 |
| Goal and audience (`:7-11`) | Phase 1 Q1 + Q2 |
| Must-have table with estimates and total vs budget (`:13-18`) | Phase 1 Q3 + Phase 2 estimates |
| Nice-to-have, Out of scope (`:20-28`) | Phase 1 Q4 + features cut in Phase 2 |
| Tech stack (`:30-34`) | Phase 1 Q6 + safer choices from Phase 2 step 3 |
| Day-by-day plan (`:36-46`) | Derived by Claude from the estimates and budget |
| Definition of done (`:48-54`) | Phase 1 Q7 |
| Risks (`:56-60`) | Phase 2 step 3 risk flags |

The template shows only one row or one day per section (for example a single feature row at line 17, and Day 1 and Day 2). `SKILL.md:40` tells Claude to "Add rows and days as needed", so the template shows the **shape**, not the length.

| Pros | Cons |
|---|---|
| Zero code: the whole skill is two Markdown files, easy to read and edit | Behavior depends on Claude obeying the text. Nothing *forces* a phase order (no code checks it) |
| Cheap on context thanks to progressive disclosure | Auto-triggering depends on the description wording, which can miss or misfire |
| The fixed template gives consistent, comparable `REQUIREMENTS.md` files across projects | A fixed template can feel rigid for unusual projects (a game jam, a pure research project) |
| Two human gates (end of Phase 2, end of Phase 4) keep the user in control | More back-and-forth messages before anything is produced |
| Phase 2 forces an honest time estimate, the main reason side projects fail | Hour estimates made by an LLM are rough guesses; the 20% buffer is a rule of thumb |

## Alternatives

- **Put the template inside `SKILL.md`:** one file instead of two. Simpler to maintain, and fine for a short template. You'd pick it if the template were 10 lines. The cost is that the template would be loaded during Phases 1 and 2 for no reason, and Claude would be more tempted to start filling it early.
- **A slash command instead of a skill:** a command only runs when you type it (for example `/scope`). No accidental triggering, fully predictable. Pick it if you find the skill triggering when you don't want it. You lose the "just describe your idea and it kicks in" behavior.
- **A subagent instead of a skill:** a subagent is a separate Claude instance with its own context window and its own instructions (this repo has one: `agents/tutor.md`). It would keep the long question-and-answer out of the main conversation. But subagents work best for one-shot tasks; scoping needs several back-and-forth turns with the user, which fits better in the main conversation, so a skill is the better fit here.

## Key snippets

### 1. The frontmatter, the only part always loaded

```markdown
---
name: scope-project          # skill id; becomes /claude-dev-toolkit:scope-project
description: Turns a project idea into a REQUIREMENTS.md by asking questions first, challenging the scope, then filling a fixed template.   # WHAT it does
  Use when the user wants to scope, plan, or start a new project, says "new project idea", "I want to build", "plan this", "what should v1 include", or describes an app, tool, game or site they want to make.   # WHEN: literal phrases users actually type
  Do not use for changes to code in an existing project, bug fixes, or single features.   # WHEN NOT: prevents false triggers
---
```
(In the real file, line 3 is one single line; it is split here only so the comments fit.)

This is the whole "routing logic": if the description is vague, the skill never triggers or triggers at the wrong time.

### 2. The marketplace pointing at the repo itself

```json
"plugins": [
  {
    "name": "claude-dev-toolkit",   // the plugin to install; the part before @ in plugin@marketplace
    "source": "./",                 // the plugin lives at the root of this same repo
    "description": "Skills, hooks and a tutor subagent ...",
    "version": "0.1.0"              // should match plugin.json's version
  }
]
```
(`marketplace.json:11-18`.) This is what makes `/plugin install` work: without it, Claude Code would not know that this GitHub repo contains a plugin.

### 3. The global rule and the Phase 2 gate

```markdown
Work through the four phases in order. Never skip a phase, and never write a file before Phase 3.   <!-- line 8: global ordering rule -->
...
   - Over budget by more than 20%: say so plainly, show the numbers, and propose specific cuts (...). Wait for the user's choice.   <!-- line 30: the "honest" branch -->
...
Do not move to Phase 3 until the user agrees on the scope.   <!-- line 35: the gate -->
```
These lines turn a simple "write me a requirements doc" into a process with checkpoints. Without them, an LLM tends to jump straight to producing the file.

### 4. The template rows that join Phase 1 and Phase 2

```markdown
| # | Feature | Estimate |
|---|---|---|
| 1 | {{feature, phrased as something a user can do}} | {{N h}} |   <!-- Q3 answer + Phase 2 estimate; repeated per feature -->
| | **Total** | **{{N h}}** / {{N h}} budget |                       <!-- Phase 2 total vs Q5 budget, visible to the reader -->
```
(`template.md:15-18`.) The total-vs-budget line puts the Phase 2 check into the final document, so the user sees it every time they open the plan.

## Things worth noticing (small issues)

- `template.md:53` hard-codes "README with a demo GIF" in the definition of done. That's great for a portfolio project, but not for a pure learning exercise. `SKILL.md:40` ("Remove any template line that doesn't apply") covers it, but only if Claude notices.
- The "Under budget by a lot" branch (`SKILL.md:31`) has no number, unlike "more than 20%" for over budget. Two runs could make different decisions here. Something like "more than 30% under" would be more consistent.
- The version `0.1.0` is written in three places (`plugin.json:3`, `marketplace.json:9` and `:16`) plus the `hello` skill text (`skills/hello/SKILL.md:13`). When you release, they can easily fall out of sync.

## Quiz

1. What does the `description` at the top of `SKILL.md` decide?
2. Why is the template kept in its own file instead of inside `SKILL.md`?
3. What happens if your idea needs 60 hours but you only have 20?

<details>
<summary>Answers</summary>

1. It decides when Claude uses the skill. Claude always reads the description, and starts the skill when your message matches it.
2. So Claude only loads the template when it needs it (in Phase 3). This keeps Claude's context lighter, and you can change the template without touching the instructions.
3. In Phase 2, the skill tells you the plan is too big and proposes things to cut. It waits for your choice before writing anything.

</details>

## What to ask about next

- How Claude Code passes the skill's folder path so that "Read `template.md` from this skill's folder" resolves correctly.
- How the `agents/tutor.md` subagent differs from a skill in how it is discovered and run.
- How hooks (planned in `PLAN.md`) would be declared in the plugin.
