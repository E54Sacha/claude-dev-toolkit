import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readLessonsConfig } from "../hooks/lessons-config.mjs";

const SETUP = fileURLToPath(new URL("../skills/setup-lessons/setup.mjs", import.meta.url));
const SESSION = fileURLToPath(new URL("../hooks/session-start.mjs", import.meta.url));
// A fake home folder, so the real ~/.claude/lessons.json is never touched.
const withHome = (home) => ({ ...process.env, HOME: home, USERPROFILE: home });
const tmp = () => mkdtempSync(join(tmpdir(), "lessons-"));

test("readLessonsConfig: missing, bad path, no marker, ok", () => {
  const home = tmp();
  try {
    const file = join(home, "lessons.json");
    assert.equal(readLessonsConfig(file).reason, "missing");
    writeFileSync(file, JSON.stringify({ path: "relative/dir" }));
    assert.match(readLessonsConfig(file).reason, /absolute/);
    writeFileSync(file, JSON.stringify({ path: home }));
    assert.match(readLessonsConfig(file).reason, /no .lessons-repo/);
    writeFileSync(join(home, ".lessons-repo"), "");
    assert.equal(readLessonsConfig(file).ok, true);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("setup creates a lessons repo from the template and saves the config", () => {
  const home = tmp();
  try {
    const target = join(home, "my-lessons");
    const r = spawnSync(process.execPath, [SETUP, target], { encoding: "utf8", env: withHome(home) });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    assert.equal(out.created, true);
    for (const f of [".lessons-repo", "subjects.json", "assets/lesson.css", "schema/quiz.schema.json", "examples/reference-lesson.html", "README.md"]) {
      assert.ok(existsSync(join(target, f)), f);
    }
    const cfg = JSON.parse(readFileSync(join(home, ".claude", "lessons.json"), "utf8"));
    assert.equal(cfg.path, target.split("\\").join("/"));
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("setup connects an existing lessons repo without changing it, and refuses a non-empty folder", () => {
  const home = tmp();
  try {
    const existing = join(home, "existing");
    mkdirSync(existing);
    writeFileSync(join(existing, ".lessons-repo"), "");
    const r = spawnSync(process.execPath, [SETUP, existing], { encoding: "utf8", env: withHome(home) });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout).created, false);
    assert.ok(!existsSync(join(existing, "assets")));
    const busy = join(home, "busy");
    mkdirSync(busy);
    writeFileSync(join(busy, "notes.txt"), "x");
    assert.equal(spawnSync(process.execPath, [SETUP, busy], { encoding: "utf8", env: withHome(home) }).status, 1);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("session-start tells Claude the lessons path, or suggests setup-lessons", () => {
  const home = tmp();
  try {
    let r = spawnSync(process.execPath, [SESSION], { encoding: "utf8", env: withHome(home) });
    assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, /setup-lessons/);
    spawnSync(process.execPath, [SETUP, join(home, "l")], { encoding: "utf8", env: withHome(home) });
    r = spawnSync(process.execPath, [SESSION], { encoding: "utf8", env: withHome(home) });
    assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, /Lessons repo: .*\/l"/);
  } finally { rmSync(home, { recursive: true, force: true }); }
});
