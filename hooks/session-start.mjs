// SessionStart hook: tell Claude where the lessons repo is, so it can pass it to the tutor subagent.
// Subagents don't see this session's context, so the main Claude must copy the path into the task.
import { configFile, readLessonsConfig } from "./lessons-config.mjs";

const cfg = readLessonsConfig();
const text = cfg.ok
  ? `claude-dev-toolkit: the lessons repo for the tutor subagent is ${cfg.path}. ` +
    `When you delegate to tutor, always include this line in the task: "Lessons repo: ${cfg.path}". ` +
    `When the user asks to learn something or to have something explained ("teach me X", "explain Y", "how does Z work"), ` +
    `delegate to tutor right away: do not ask clarifying questions or brainstorm first (the tutor defaults to a beginner level).`
  : `claude-dev-toolkit: no lessons repo is configured for the tutor subagent (${cfg.reason}; config file: ${configFile().split("\\").join("/")}). ` +
    `Before delegating to tutor, tell the user and suggest running /claude-dev-toolkit:setup-lessons (it creates a lessons folder or connects an existing one).`;

console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: text } }));
