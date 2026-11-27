import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findSuites, isGitCommit, isTrusted, runSuites, tail } from "../hooks/test-gate-lib.mjs";

const HOOK = fileURLToPath(new URL("../hooks/test-gate.mjs", import.meta.url));
const runHook = (event) =>
  spawnSync(process.execPath, [HOOK], { input: JSON.stringify(event), encoding: "utf8", env: { ...process.env, TEST_GATE_CONFIG: join(tmpdir(), "no-such-test-gate.json") } });
const tmp = () => mkdtempSync(join(tmpdir(), "gate-"));

test("spots git commit in all its forms", () => {
  for (const cmd of [
    "git commit -m 'x'",
    "git add -A && git commit -q -m \"Release\"",
    "cd repo; git commit",
    'git -C "C:/My Repo" commit -m x',
    "git -c user.name=x commit --amend --no-edit",
  ]) assert.ok(isGitCommit(cmd), cmd);
  for (const cmd of ["git status", "git log --oneline", "echo committed", "git commit-tree abc", "git commit --dry-run", "npm run commitlint", undefined]) {
    assert.ok(!isGitCommit(cmd), String(cmd));
  }
});

test("only repos listed in the config are trusted", () => {
  const dir = tmp();
  const config = join(dir, "test-gate.json");
  assert.equal(isTrusted("C:/work/app", config), false); // no config file
  writeFileSync(config, JSON.stringify({ repos: ["C:\\work\\App\\"] }));
  assert.equal(isTrusted("c:/work/app", config), true);
  assert.equal(isTrusted("C:/work/other", config), false);
  writeFileSync(config, "not json");
  assert.equal(isTrusted("C:/work/app", config), false);
});

test("refuses a virtual environment committed to the repo", () => {
  const root = tmp();
  spawnSync("git", ["init", "-q"], { cwd: root });
  const bin = join(root, ".venv", process.platform === "win32" ? "Scripts" : "bin");
  mkdirSync(bin, { recursive: true });
  const python = join(bin, process.platform === "win32" ? "python.exe" : "python");
  writeFileSync(python, "");
  writeFileSync(join(root, "pytest.ini"), "[pytest]\n");
  spawnSync("git", ["add", "-f", python], { cwd: root });
  const { suites, skipped } = findSuites(root);
  assert.equal(suites.length, 0);
  assert.match(skipped[0], /committed to git/);
});

test("finds pytest with its venv and npm test scripts, one level deep", () => {
  const root = tmp();
  mkdirSync(join(root, "api", ".venv", "Scripts"), { recursive: true });
  writeFileSync(join(root, "api", "pyproject.toml"), "[tool.pytest.ini_options]\ntestpaths = ['tests']\n");
  writeFileSync(join(root, "api", ".venv", "Scripts", "python.exe"), "");
  mkdirSync(join(root, "web"));
  writeFileSync(join(root, "web", "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs", "package.json"), JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } }));
  mkdirSync(join(root, "tool"));
  writeFileSync(join(root, "tool", "pytest.ini"), "[pytest]\n");
  mkdirSync(join(root, "vendored", ".git"), { recursive: true }); // a nested repo: never scanned
  writeFileSync(join(root, "vendored", "package.json"), JSON.stringify({ scripts: { test: "node evil.js" } }));

  const { suites, skipped } = findSuites(root);
  assert.deepEqual(suites.map((s) => [s.label, s.dir]), [["pytest", join(root, "api")], ["npm test", join(root, "web")]]);
  assert.equal(skipped.length, 1); // tool/ has pytest but no venv
  assert.match(skipped[0], /no \.venv/);
});

test("tail keeps the end of the output", () => {
  assert.equal(tail("a\nb\nc\n", 2), "b\nc");
});

test("lets other commands, untrusted repos and repos without tests through", () => {
  const repo = tmp();
  writeFileSync(join(repo, "pytest.ini"), "[pytest]\n"); // has tests, but the repo isn't opted in
  spawnSync("git", ["init", "-q"], { cwd: repo });
  assert.equal(runHook({ tool_name: "Bash", tool_input: { command: "ls" }, cwd: repo }).status, 0);
  assert.equal(runHook({ tool_name: "Bash", tool_input: { command: "git commit -m x" }, cwd: repo }).status, 0);
  assert.equal(runHook({ tool_name: "Bash", tool_input: { command: "git commit -m x" }, cwd: tmpdir() }).status, 0); // not a repo
});

test("stops at the first failing suite and explains it", () => {
  const suites = [
    { dir: "/r/api", label: "pytest", file: "python", args: [] },
    { dir: "/r/web", label: "npm test", file: "npm", args: ["test"] },
  ];
  const calls = [];
  const spawn = (results) => (file, args, opts) => {
    calls.push([file, opts.cwd, opts.shell]);
    return results.shift();
  };
  const failing = runSuites(suites, spawn([{ status: 1, stdout: "FAILED test_x - assert 1 == 2", stderr: "" }]), "linux");
  assert.equal(failing.ok, false);
  assert.match(failing.message, /commit was blocked/);
  assert.match(failing.message, /FAILED test_x/);
  assert.equal(calls.length, 1); // didn't go on to the next suite

  calls.length = 0;
  assert.equal(runSuites(suites, spawn([{ status: 0 }, { status: 0 }]), "win32").ok, true);
  assert.deepEqual(calls.map((c) => c[2]), [false, true]); // shell only for npm on Windows

  assert.equal(runSuites(suites, spawn([{ status: null, signal: "SIGTERM", error: { code: "ETIMEDOUT" } }])).ok, false);
  assert.equal(runSuites(suites, spawn([{ error: { code: "ENOENT", message: "not found" } }])).ok, true); // can't run: don't block
});
