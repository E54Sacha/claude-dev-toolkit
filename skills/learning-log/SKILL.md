---
name: learning-log
description: Adds what the user learned in this session to LEARNINGS.md at the project root, after they confirm. Use at the end of a work session, or when the user says "log what I learned", "wrap up", "end of session", "add this to my learnings", or "what did I learn today".
---

# Learning log

Goal: a `LEARNINGS.md` in each project that shows, session after session, what the user learned while building it. It feeds the README ("What I learned") and interview preparation.

## Step 1: Look back at the session

Go through this conversation and pick what the **user** learned or decided (not what you already knew):

- **Concept:** a new idea, tool or technique they used or asked about.
- **Bug:** something that broke, its real cause, and the fix.
- **Decision:** a choice that was made, and why (including options that were rejected).

Prefer things they could reuse in another project. Skip routine actions (commits, file moves) and anything already in `LEARNINGS.md`: read it first if it exists.

## Step 2: Propose, don't write yet

Show 3 to 6 numbered draft entries, each one line, in plain words (as the user would explain it to a friend). Ask: "Keep, edit or remove any of these?" Wait for the answer. Use the question tool if one is available.

## Step 3: Append

Write only the entries the user kept, with their edits, at the **end** of `LEARNINGS.md` at the project root. Create the file if needed, starting with `# What I learned building <project name>`.

- **Never rewrite or delete old entries.** Only append.
- If today already has a section, add the new entries under it instead of making a second heading.

Format:

```markdown
## YYYY-MM-DD

- **Concept:** <name>: <one-line explanation in the user's words>
- **Bug:** <symptom> → <real cause> → <fix>
- **Decision:** <choice>, because <reason>
```

## Step 4: Hand off

Reply with the file path and the number of entries added. If a concept deserves a full lesson, suggest it in one line: "Want a lesson on <concept>? Ask: *teach me about <concept>*" (the `tutor` subagent writes it).
