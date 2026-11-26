# Claude Code subagents

> Example used: `agents/tutor.md`

## The idea

A subagent is a helper assistant that the main Claude can hand a job to. It is like a manager giving one task to a specialist colleague: the specialist works alone, then hands back a short report. Each subagent has its own instructions, its own allowed tools and its own memory of the conversation. This keeps the main conversation tidy and makes sure some jobs are always done the same way.

## Key words

- **Subagent:** a separate Claude with its own role, started by the main Claude to do one task.
- **Frontmatter:** the block between the two `---` lines at the top of the file, holding settings like name and tools.
- **Description:** a sentence that tells the main Claude *when* to call this subagent.
- **System prompt:** the text under the frontmatter; it is the subagent's permanent job description.
- **Context window:** the "working memory" of one conversation; a subagent starts with a fresh, empty one.

## How it works

1. You write a Markdown file: frontmatter on top, instructions below.
2. Claude Code reads the `name` and `description` of every subagent when it starts.
3. When your request matches a description, the main Claude delegates the task to that subagent.
4. The subagent starts fresh: it only sees its system prompt and the task message, not your whole chat.
5. It works using only the tools it is allowed, then sends one final report back.
6. The main Claude reads that report and continues talking with you.

## In this project

The tutor subagent explains code to beginners and saves each lesson as a file. Its description lists phrases like "explain this" so the main Claude knows to call it. It may only read, search and write files, so it cannot run commands. Its system prompt also limits where it may write (`docs/explanations/`), forces a fixed lesson template, and asks for a very short final reply.

```markdown
---
name: tutor                      # how the subagent is identified
description: Explains code to a beginner developer ... Use when the user
  asks to explain, teach, or walk through code ...   # trigger: when to call it
tools: Read, Grep, Glob, Write   # only these tools, no shell commands
---

You are a patient tutor for a **beginner** computer science student ...
                                 # system prompt starts here: its job description
```

(The description is shortened here with `...`; it is one long line in the real file.)

## Why use it

- ✅ The main conversation stays clean: the subagent's file reading stays in its own memory.
- ✅ A specialist job is done the same way every time, with the same rules.
- ✅ Limiting tools makes it safer: a helper that can't run commands can't break much.
- ⚠️ The subagent doesn't see your earlier chat, so the task message must contain everything it needs.
- ⚠️ A vague description means the main Claude may call it at the wrong time, or never.

## Other ways

- **Skill:** use it when you want extra instructions loaded into the *main* conversation instead of a separate helper.
- **Just asking the main Claude:** fine for a quick one-off task that needs no special rules.

## Quiz

1. **[Open]** What is a subagent in Claude Code?
2. **[Fill in the blank]** A subagent's settings, like its name and tools, go in the _____, the block between the two `---` lines.
3. **[Multiple choice]** How does the main Claude decide which subagent to call?
   - A) It always calls the first subagent in the folder
   - B) It asks you to pick one every time
   - C) It compares your request with each subagent's description
   - D) It calls every subagent and keeps the best answer
4. **[True or false]** If a subagent's description is vague, Claude will still call it at the right moments.
5. **[Fill in the blank]** The instructions under the frontmatter are called the subagent's _____ prompt.
6. **[Open]** Why does a subagent start with an empty context window?
7. **[True or false]** A subagent can see everything you said earlier in your chat with the main Claude.
8. **[Multiple choice]** Why would you limit the tools a subagent can use?
   - A) For safety and focus: it can only do what its job needs
   - B) Because subagents can't use more than four tools
   - C) To make its answers longer
   - D) Tools only work in the main conversation
9. **[True or false]** When a subagent finishes, it sends one final report back to the main Claude.

<details>
<summary>Answers</summary>

1. A separate Claude with its own role, instructions and tools, that the main Claude can hand one task to.
2. **Frontmatter.** It holds the settings; the instructions come after it.
3. **C.** The description says when to use the subagent. D is tempting, but calling every subagent would waste time and mix results.
4. **False.** A vague description makes Claude call it for the wrong tasks, or not call it at all.
5. **System.** It's the subagent's permanent job description, used every time it runs.
6. So it isn't cluttered by the main chat, and its own work (like reading many files) doesn't fill up the main conversation.
7. **False.** It only sees its system prompt and the task message, so the task message must contain every detail it needs.
8. **A.** A helper that can only read files can't accidentally run a dangerous command. B is wrong: there's no four-tool limit.
9. **True.** The main Claude reads that report, then continues talking with you.

</details>

## Things worth noticing

- The system prompt says "Write only inside `docs/explanations/`", but the `Write` tool itself can write anywhere. The limit is only a written rule, not a technical lock.

## What to ask about next

- How Claude Code skills differ from subagents
- How tool permissions work in Claude Code
