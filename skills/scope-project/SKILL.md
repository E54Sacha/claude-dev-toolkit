---
name: scope-project
description: Turns a project idea into a REQUIREMENTS.md by asking questions first, challenging the scope, then filling a fixed template. Use when the user wants to scope, plan, or start a new project, says "new project idea", "I want to build", "plan this", "what should v1 include", or describes an app, tool, game or site they want to make. Do not use for changes to code in an existing project, bug fixes, or single features.
---

# Scope a project

Goal: turn a vague idea into a `REQUIREMENTS.md` the user will actually follow. Work through the four phases in order. Never skip a phase, and never write a file before Phase 3.

## Phase 1: Understand (ask, don't write)

Read anything the user already gave (the idea, links, an existing README). Do not ask what they already answered.

Then ask ALL remaining questions in ONE grouped message. If a question tool is available (such as AskUserQuestion), use it. Give your recommendation for each question, based on the idea, so the user can just accept.

1. **Goal:** what problem does it solve, and for whom?
2. **Why:** portfolio piece, learning goal, or real users? (This changes what "done" means.)
3. **Must-haves:** the features v1 cannot ship without. Maximum 5.
4. **Nice-to-haves and out of scope:** what can wait, and what will they be tempted to add but shouldn't?
5. **Time budget:** how many days, and how many hours per day?
6. **Tech constraints:** an imposed or preferred stack, target platforms, hosting, money they can spend.
7. **Definition of done:** what must work in the final demo?

If an answer is vague ("make it nice", "some features"), ask one follow-up. Otherwise move on.

## Phase 2: Challenge the scope

1. Estimate each must-have in hours, assuming the user codes with an AI assistant. Add 20% for setup, deployment and the README.
2. Compare the total with the time budget.
   - Over budget by more than 20%: say so plainly, show the numbers, and propose specific cuts (move features to nice-to-have, or pick simpler tech). Wait for the user's choice.
   - Under budget by more than 30%: say so, and suggest one nice-to-have that would make the project stand out.
   - Close to budget: say it fits, and move on.
3. Flag any tech choice that is risky for the time budget (new language, unfamiliar framework, paid API), and offer a safer option.

Do not move to Phase 3 until the user agrees on the scope.

## Phase 3: Write REQUIREMENTS.md

1. Read `template.md` from this skill's folder.
2. Fill every `{{...}}` placeholder. Remove any template line that doesn't apply rather than leaving a placeholder. Add rows and days as needed.
3. Rules:
   - Write must-haves as things a user can do ("A visitor can filter projects by tag"), not as tech tasks.
   - Every day in the plan ends on something demoable.
   - Every definition-of-done item can be checked by someone else. Keep the README and deployment items only when they fit the "why" from Phase 1 (a learning exercise may need neither).
   - Use the user's answers, not your own ideas. If you add something they didn't ask for, put it in nice-to-have.
4. Save it as `REQUIREMENTS.md` at the project root (the current working directory unless the user said otherwise).
   - If a `REQUIREMENTS.md` already exists, read it, tell the user what would change, and ask before overwriting.

## Phase 4: Hand off

Reply with:

- The file path.
- A summary of 5 lines max: pitch, must-haves count, total hours vs budget, stack, biggest risk.
- One question: "Start Day 1?"

Do not start coding until the user says yes.
