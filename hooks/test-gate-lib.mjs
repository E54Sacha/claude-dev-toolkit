// Pure helpers for test-gate.mjs, kept separate so they can be unit-tested.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/** ~/.claude/test-gate.json: {"repos": ["C:/path/to/repo", ...]}. Only these repos get their tests run. */
export function configPath() {
  return process.env.TEST_GATE_CONFIG || join(homedir(), ".claude", "test-gate.json");
}

// Compare paths case-insensitively with forward slashes: "C:\Work\App\" and "c:/work/app" are the same repo.
const norm = (p) => resolve(p).replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();

/**
 * Running a repo's tests runs that repo's code, so the gate is opt-in: a repo you just cloned
 * must never execute anything because Claude committed in it.
 */
export function isTrusted(root, path = configPath()) {
  try {
    const repos = JSON.parse(readFileSync(path, "utf8")).repos;
    return Array.isArray(repos) && repos.some((r) => typeof r === "string" && norm(r) === norm(root));
  } catch {
    return false;
  }
}

/** True if git tracks this path (a committed virtual environment could hide any program). */
export function isTracked(root, path) {
  return spawnSync("git", ["ls-files", "--error-unmatch", path], { cwd: root, encoding: "utf8" }).status === 0;
}

/** True if a shell command runs `git commit` (also after `&&`, `;`, or with `git -C dir commit`). */
export function isGitCommit(command) {
  if (typeof command !== "string") return false;
  return /(?:^|[;&|(]\s*|\s)git(?:\s+-C\s+(?:"[^"]*"|'[^']*'|\S+)|\s+-c\s+\S+)*\s+commit\b(?![\w-])/.test(command) && !/\bcommit\b[^;&|]*--dry-run/.test(command);
}

/** The python inside a virtual environment folder, if there is one. */
export function venvPython(dir) {
  for (const venv of [".venv", "venv"]) {
    for (const exe of [join("Scripts", "python.exe"), join("bin", "python")]) {
      const path = join(dir, venv, exe);
      if (existsSync(path)) return path;
    }
  }
  return null;
}

function hasPytestConfig(dir) {
  if (existsSync(join(dir, "pytest.ini"))) return true;
  for (const file of ["pyproject.toml", "setup.cfg", "tox.ini"]) {
    const path = join(dir, file);
    if (existsSync(path) && /\[(tool\.pytest\.ini_options|tool:pytest|pytest)\]/.test(readFileSync(path, "utf8"))) return true;
  }
  return false;
}

function npmTestScript(dir) {
  const path = join(dir, "package.json");
  if (!existsSync(path)) return null;
  try {
    const script = JSON.parse(readFileSync(path, "utf8")).scripts?.test;
    // npm init's placeholder only prints an error: not a real test suite.
    return script && !/no test specified/.test(script) ? script : null;
  } catch {
    return null;
  }
}

/**
 * The test suites of a repo: the root and its direct sub-folders (api/, web/, …).
 * pytest runs with the folder's own virtual environment; without one it's skipped (and reported).
 * Returns [{ dir, label, file, args }] to run, and [skipped reasons].
 */
export function findSuites(root) {
  const dirs = [root];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith(".") && !["node_modules", "venv", "dist", "build"].includes(entry.name)) {
      dirs.push(join(root, entry.name));
    }
  }
  const suites = [];
  const skipped = [];
  for (const dir of dirs) {
    if (hasPytestConfig(dir) || existsSync(join(dir, "tests", "conftest.py"))) {
      const python = venvPython(dir);
      if (python && isTracked(root, python)) skipped.push(`${dir}: its .venv is committed to git, refusing to run it`);
      else if (python) suites.push({ dir, label: "pytest", file: python, args: ["-m", "pytest", "-q", "-x", "--no-header", "-p", "no:cacheprovider"] });
      else skipped.push(`${dir}: pytest config found but no .venv to run it with`);
    }
    if (npmTestScript(dir)) suites.push({ dir, label: "npm test", file: "npm", args: ["test", "--silent"] });
  }
  return { suites, skipped };
}

/** The last lines of a test run, enough to see what failed. */
export function tail(text, lines = 25) {
  return text.trim().split(/\r?\n/).slice(-lines).join("\n");
}

/**
 * Runs the suites in order and stops at the first failure.
 * Returns { ok: true } or { ok: false, message } (the message is what Claude sees).
 * `spawn` is node's spawnSync (replaceable in tests).
 */
export function runSuites(suites, spawn, platform = process.platform) {
  for (const suite of suites) {
    // npm is a .cmd script on Windows and needs a shell there; its arguments are fixed strings, never user input.
    const result = spawn(suite.file, suite.args, {
      cwd: suite.dir,
      encoding: "utf8",
      timeout: 240_000,
      shell: suite.file === "npm" && platform === "win32",
      env: { ...process.env, CI: "1" },
    });
    if (result.error?.code === "ETIMEDOUT" || result.signal) {
      return { ok: false, message: `${suite.label} in ${suite.dir} took more than 4 minutes. Commit blocked; check why the tests hang (a database that isn't running?).` };
    }
    if (result.error) return { ok: true, note: `couldn't run ${suite.label} in ${suite.dir}: ${result.error.message}` };
    if (result.status !== 0) {
      return {
        ok: false,
        message:
          `the tests fail, so the commit was blocked.\nSuite: ${suite.label} in ${suite.dir}\n\n` +
          `${tail(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)}\n\nFix the failing tests (or the code), then commit again.`,
      };
    }
  }
  return { ok: true };
}
