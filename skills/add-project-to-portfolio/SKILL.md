---
name: add-project-to-portfolio
description: Writes or updates a finished project's card on the user's portfolio site (pitch, proof metrics, tech badges, links, in English and French), suggests a resume bullet and the GitHub repo description and topics, then builds, commits and pushes the portfolio. Use when the user says "add this project to my portfolio", "put it on my site", "update my portfolio card", "the project is done, show it on the portfolio", or finishes a project.
---

# Add a project to the portfolio

Goal: one finished project becomes a card on the portfolio that a recruiter understands in 10 seconds, with **only true, checkable facts**.

This skill is written for one site: the user's portfolio.

| What | Where |
|---|---|
| Portfolio repo | `C:/Side_project/portfolio` (GitHub `E54Sacha/portfolio`, deployed by Vercel on every push to `main`) |
| Project cards | `web/src/content/projects.ts` (one object per project, in build order) |
| Card format | the `Project` type at the top of that file: **read it first**, it is the source of truth if it changed |
| Languages | every text is `{ en, fr }` |

If the portfolio folder isn't there, ask the user where it is and stop until they answer.

## Step 1: Read the project (don't ask yet)

The project is the current directory, unless the user named another one. Read:

- `README.md`, `REQUIREMENTS.md` (pitch, definition of done), `LEARNINGS.md`, `CHANGELOG.md`.
- Manifests (`package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, …) for the real tech.
- `git tag` and `git remote -v`; `gh repo view --json name,description,homepageUrl,repositoryTopics,url` if `gh` works.
- The tests: run the test command, or count the tests, to get a real number.

Then read `projects.ts` in the portfolio and check whether the project **already has a card** (same title, or a `planned` / `building` card describing it, like "Habit tracker" for a `habit-tracker` repo).

## Step 2: Write the card

| Field | Rule |
|---|---|
| `number` | Existing card: keep it. New card: the next number. |
| `title` | Short, what it is ("CHIP-8 emulator"). Same in both languages unless a translation is natural. |
| `pitch` | One sentence, what a user gets from it, no buzzwords: "A CPU emulator that runs 1970s games in your browser." |
| `status` | `"live"` once it is released or deployed; `"building"` if not finished yet. |
| `color` | Existing card: keep it. New card: the colour used least among the other cards. |
| `tech` | 3 to 5, only what recruiters search for (`PostgreSQL`, `Docker`, `FastAPI`), not every library. |
| `proof` | 1 or 2 short facts someone can check: tests count, Lighthouse score, version released, users, latency, test ROMs passed. |
| `links` | "Code on GitHub" (repo URL), plus a live demo and/or a write-up if they exist. A link starting with `/` is a page of the portfolio and gets the language prefix added by the site. |

Rules:

1. **Never invent.** Every number in `proof` must come from something you saw in Step 1 (a test run, a tag, `REQUIREMENTS.md`, the README). Nothing checkable? Use one fact that is ("v1.0.0 released") rather than a made-up metric, and tell the user what metric would be worth measuring.
2. **French text:** natural French, not a word-for-word translation. Match the typography already in the file: curly apostrophes (`’`), the same spacing before `:` `;` `?` `!` as the other cards.
3. Keep the style of the other cards (length of pitches, wording of links such as `Code on GitHub` / `Code sur GitHub`).
4. Change **only this project's object**. Don't reorder or reword the other cards.

## Step 3: Resume bullet and repo details

Print, in the chat (don't write them anywhere):

- **Resume bullet**, with the formula *Built [what] using [key tech], achieving [measurable result].* In English and French. The result must be one of the true proof facts.
- **GitHub description:** one line saying what it is.
- **Topics:** 3 to 6 lowercase tags (`typescript`, `emulator`, `fastapi`).

Repo naming rules (lowercase, words joined by hyphens, says what it is, 1 to 3 words, no `my-`, `test-`, `v2`): if the repo name breaks them, **only suggest** a new name. Never rename the repo yourself, since that breaks links.

If `gh` is logged in, apply the description and topics:
`gh repo edit <owner>/<repo> --description "<line>" --add-topic <t1> --add-topic <t2>`
Skip this when the repo already has a good description and topics.

## Step 4: Check, commit, push

In the portfolio repo:

1. `git status`. If files other than `projects.ts` are modified, leave them alone: stage only `web/src/content/projects.ts`.
2. In `web/`: `npm run lint` then `npm run build`. **If either fails, stop**: fix the card (usually a typo or a missing language) and run them again. Never push a failing build.
3. Commit with a message like `Portfolio: add <project> card` (or `update`), then `git push`. Vercel redeploys the live site.
4. About a minute later, fetch the live `/en` page and check the card's title is in it. If it isn't there after 3 minutes, say so.

## Step 5: Hand off

Reply with:

- The card as it now reads (title, pitch, proof, tech, links, in both languages).
- The resume bullet (EN and FR), and whether the repo description and topics were applied.
- The commit and whether the live site shows the card.
- Anything missing, e.g. "No live demo link: add one once it's deployed" or "No real metric yet: measure X".
