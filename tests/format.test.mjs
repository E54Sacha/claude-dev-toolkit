import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findPrettier, formatterFor, isIgnored } from "../hooks/format-lib.mjs";

const HOOK = fileURLToPath(new URL("../hooks/format.mjs", import.meta.url));
const runHook = (event) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify(event), encoding: "utf8" });

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

test("findPrettier walks up to the project's node_modules, or returns null", () => {
  const root = mkdtempSync(join(tmpdir(), "fmt-"));
  try {
    mkdirSync(join(root, "src", "deep"), { recursive: true });
    assert.equal(findPrettier(join(root, "src", "deep", "a.js"), "linux"), null);
    mkdirSync(join(root, "node_modules", ".bin"), { recursive: true });
    writeFileSync(join(root, "node_modules", ".bin", "prettier"), "");
    assert.equal(findPrettier(join(root, "src", "deep", "a.js"), "linux"), join(root, "node_modules", ".bin", "prettier"));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("hook exits 0 and does nothing for bad input, unknown files or no formatter", () => {
  const root = mkdtempSync(join(tmpdir(), "fmt-"));
  try {
    writeFileSync(join(root, "a.txt"), "x");
    writeFileSync(join(root, "a.js"), "const   x=1");
    assert.equal(spawnSync(process.execPath, [HOOK], { input: "not json", encoding: "utf8" }).status, 0);
    assert.equal(runHook({ tool_input: {} }).status, 0);
    assert.equal(runHook({ tool_input: { file_path: join(root, "missing.js") } }).status, 0);
    assert.equal(runHook({ tool_input: { file_path: join(root, "a.txt") } }).status, 0);
    const r = runHook({ tool_input: { file_path: join(root, "a.js") } }); // no Prettier in this folder
    assert.equal(r.status, 0);
    assert.equal(readFileSync(join(root, "a.js"), "utf8"), "const   x=1");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("hook runs the project's Prettier on the edited file", () => {
  const root = mkdtempSync(join(tmpdir(), "fmt-"));
  try {
    const bin = join(root, "node_modules", ".bin");
    mkdirSync(bin, { recursive: true });
    // A fake "prettier" that replaces the file's content, so we can see it was called on the right file.
    writeFileSync(join(bin, "fake.cjs"), 'require("fs").writeFileSync(process.argv[process.argv.length - 1], "FORMATTED" + String.fromCharCode(10));');
    writeFileSync(join(bin, "prettier.cmd"), '@node "%~dp0fake.cjs" %*\r\n');
    writeFileSync(join(bin, "prettier"), '#!/bin/sh\nnode "$(dirname "$0")/fake.cjs" "$@"\n', { mode: 0o755 });
    writeFileSync(join(root, "app.js"), "const   x=1");
    const r = runHook({ tool_input: { file_path: join(root, "app.js") } });
    assert.equal(r.status, 0);
    assert.equal(readFileSync(join(root, "app.js"), "utf8"), "FORMATTED\n");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
