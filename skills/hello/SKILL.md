---
name: hello
description: Smoke test for the claude-dev-toolkit plugin. Use when the user says "hello toolkit", asks whether the toolkit plugin is installed or loaded, or runs /claude-dev-toolkit:hello.
---

# Hello from claude-dev-toolkit

This skill only exists to prove the plugin is installed and its skills load.

When it runs, reply with exactly these lines (fill in the bracketed parts):

```
✅ claude-dev-toolkit is loaded (v0.1.0)
Skill: hello
Working directory: [the current working directory]
Coming next: scope-project, tutor, write-readme, learning-log, interview-prep, release-checklist
```

Do not call any tools other than what is needed to know the working directory. Do not add anything else.
