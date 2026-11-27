// PreToolUse hook on Bash: before Claude runs `git commit`, run the repo's tests.
// If a suite fails, the commit is blocked (exit 2) and Claude gets the failing output to fix it first.
// Finds pytest (with the folder's own .venv) and `npm test` scripts at the repo root and one level down.
// Opt-in: only for repos listed in ~/.claude/test-gate.json (running tests runs the repo's code).
// No tests found, git missing, or anything unexpected: it lets the commit through (exit 0).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { configPath, findSuites, isGitCommit, isTrusted, runSuites } from "./test-gate-lib.mjs";

const allow = (msg) => {
  if (msg) console.error(`test-gate: ${msg}`);
  process.exit(0);
};

let event = null;
try { event = JSON.parse(readFileSync(0, "utf8")); } catch { allow(); }
if (event?.tool_name !== "Bash" || !isGitCommit(event?.tool_input?.command)) allow();

const cwd = resolve(event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
if (top.status !== 0) allow();
const root = resolve(top.stdout.trim());

if (!isTrusted(root)) allow(); // not opted in: stay silent and run nothing

const { suites, skipped } = findSuites(root);
for (const reason of skipped) console.error(`test-gate: skipped ${reason}`);
if (suites.length === 0) allow(`${root} is in ${configPath()} but no test suite was found`);

const outcome = runSuites(suites, spawnSync);
if (!outcome.ok) {
  console.error(`test-gate: ${outcome.message}`);
  process.exit(2);
}
allow(outcome.note);
