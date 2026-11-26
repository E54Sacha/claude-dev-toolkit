import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findOnPath, findPrettier, formatterFor, isIgnored, isInside } from "../hooks/format-lib.mjs";

const HOOK = fileURLToPath(new URL("../hooks/format.mjs", import.meta.url));
const runHook = (event, root) =>
  spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(event),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });

// A fake Prettier package: its "bin" replaces the file's content, so we can see it ran on the right file.
function fakePrettier(dir) {
  const pkg = join(dir, "node_modules", "prettier");
  mkdirSync(join(pkg, "bin"), { recursive: true });
  writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "prettier", bin: "./bin/prettier.cjs" }));
  writeFileSync(join(pkg, "bin", "prettier.cjs"), 'require("fs").writeFileSync(process.argv[process.argv.length - 1], "FORMATTED");');
}

const tmp = () => mkdtempSync(join(tmpdir(), "fmt-"));

test("picks the formatter from the extension", () => {
  assert.equal(formatterFor("a/b.ts"), "prettier");
  assert.equal(formatterFor("README.MD"), "prettier");
  assert.equal(formatterFor("main.py"), "ruff");
  assert.equal(formatterFor("notes.txt"), null);
  assert.equal(formatterFor("Makefile"), null);
});

test("never touches dependencies, build output or minified files", () => {
  assert.ok(isIgnored("/p/node_modules/x/index.js"));
  assert.ok(isIgnored(String.raw`C:\p\dist\app.js`));
  assert.ok(isIgnored("/p/vendor.min.js"));
  assert.ok(!isIgnored("/p/src/app.js"));
});

test("isInside", () => {
  assert.ok(isInside("/p", "/p/a/b.js"));
  assert.ok(!isInside("/p", "/other/b.js"));
  assert.ok(!isInside("/p/a", "/p/ab/c.js"));
});

test("findPrettier finds the project's Prettier, never above the project root", () => {
  const home = tmp();
  try {
    const project = join(home, "project");
    mkdirSync(join(project, "src", "deep"), { recursive: true });
    const file = join(project, "src", "deep", "a.js");
    fakePrettier(home); // planted above the project
    assert.equal(findPrettier(file, project), null);
    fakePrettier(project);
    assert.equal(findPrettier(file, project), join(project, "node_modules", "prettier", "bin", "prettier.cjs"));
    assert.equal(findPrettier(join(home, "outside.js"), project), null);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("findOnPath skips relative PATH entries and folders inside the project", () => {
  const root = tmp();
  try {
    const project = join(root, "project");
    const trusted = join(root, "tools");
    mkdirSync(join(project, "bin"), { recursive: true });
    mkdirSync(trusted, { recursive: true });
    writeFileSync(join(project, "bin", "ruff"), "");
    const env = { PATH: ["bin", join(project, "bin")].join(delimiter) };
    assert.equal(findOnPath("ruff", project, env, "linux"), null);
    writeFileSync(join(trusted, "ruff"), "");
    env.PATH += delimiter + trusted;
    assert.equal(findOnPath("ruff", project, env, "linux"), join(trusted, "ruff"));
    assert.equal(findOnPath("ruff", project, env, "win32"), null); // Windows needs ruff.exe
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("hook exits 0 and does nothing for bad input, unknown files or no formatter", () => {
  const root = tmp();
  try {
    writeFileSync(join(root, "a.txt"), "x");
    writeFileSync(join(root, "a.js"), "const   x=1");
    assert.equal(spawnSync(process.execPath, [HOOK], { input: "not json", encoding: "utf8" }).status, 0);
    assert.equal(runHook({ tool_input: {} }, root).status, 0);
    assert.equal(runHook({ tool_input: { file_path: join(root, "missing.js") } }, root).status, 0);
    assert.equal(runHook({ tool_input: { file_path: join(root, "a.txt") } }, root).status, 0);
    assert.equal(runHook({ tool_input: { file_path: join(root, "a.js") } }, root).status, 0);
    assert.equal(readFileSync(join(root, "a.js"), "utf8"), "const   x=1");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("hook runs the project's Prettier with node, even on a file name full of shell characters", () => {
  const root = tmp();
  try {
    fakePrettier(root);
    const weird = join(root, 'a & echo pwned %PATH% $(x) "q".js');
    let name = weird;
    try { writeFileSync(weird, "const   x=1"); } catch { name = join(root, "a & b %x% $(y).js"); writeFileSync(name, "const   x=1"); } // '"' isn't allowed on Windows
    const r = runHook({ tool_input: { file_path: name } }, root);
    assert.equal(r.status, 0);
    assert.equal(readFileSync(name, "utf8"), "FORMATTED");
    assert.doesNotMatch(r.stdout + r.stderr, /pwned/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("hook ignores files outside the project", () => {
  const root = tmp();
  try {
    const project = join(root, "project");
    mkdirSync(project);
    fakePrettier(root);
    writeFileSync(join(root, "outside.js"), "const   x=1");
    assert.equal(runHook({ tool_input: { file_path: join(root, "outside.js") } }, project).status, 0);
    assert.equal(readFileSync(join(root, "outside.js"), "utf8"), "const   x=1");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
